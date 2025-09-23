import { SQL, sql, asc, desc } from 'drizzle-orm';
import { spatialFunctions } from './columns.js';

// Type for spatial conditions
type SpatialCondition = {
  type: 'contains' | 'intersects' | 'distance' | 'mbrWithin' | 'custom';
  sql: SQL;
};

// Type for where conditions
type WhereCondition = {
  type: 'equals' | 'notEquals' | 'greaterThan' | 'lessThan' | 'like' | 'in' | 'isNull' | 'isNotNull' | 'custom';
  sql: SQL;
};

// Type for select fields
type SelectField = {
  expression: SQL;
  alias?: string;
};

export class SpatiaLiteQueryBuilder<T = any> {
  private tableName: string;
  private selectFields: SelectField[] = [];
  private whereConditions: (WhereCondition | SpatialCondition)[] = [];
  private orderByFields: { field: SQL; direction: 'asc' | 'desc' }[] = [];
  private limitValue?: number;
  private offsetValue?: number;

  constructor(tableName: string) {
    this.tableName = tableName;
  }

  // SELECT fields
  select(fields: Record<string, SQL> | '*') {
    if (fields === '*') {
      this.selectFields = [{ expression: sql`*` }];
    } else {
      this.selectFields = Object.entries(fields).map(([alias, expression]) => ({
        expression,
        alias
      }));
    }
    return this;
  }

  // WHERE conditions
  where(condition: SQL) {
    this.whereConditions.push({
      type: 'custom',
      sql: condition
    });
    return this;
  }

  // WHERE field = value
  whereEquals(field: string, value: any) {
    this.whereConditions.push({
      type: 'equals',
      sql: sql`${sql.identifier(field)} = ${value}`
    });
    return this;
  }

  // WHERE field LIKE pattern
  whereLike(field: string, pattern: string) {
    this.whereConditions.push({
      type: 'like',
      sql: sql`${sql.identifier(field)} LIKE ${pattern}`
    });
    return this;
  }

  // WHERE field IN (values)
  whereIn(field: string, values: any[]) {
    this.whereConditions.push({
      type: 'in',
      sql: sql`${sql.identifier(field)} IN (${values.map(v => sql`${v}`).join(', ')})`
    });
    return this;
  }

  // WHERE field IS NULL
  whereIsNull(field: string) {
    this.whereConditions.push({
      type: 'isNull',
      sql: sql`${sql.identifier(field)} IS NULL`
    });
    return this;
  }

  // WHERE field IS NOT NULL
  whereIsNotNull(field: string) {
    this.whereConditions.push({
      type: 'isNotNull',
      sql: sql`${sql.identifier(field)} IS NOT NULL`
    });
    return this;
  }

  // Spatial WHERE conditions
  whereContains(geomField: string, point: SQL) {
    this.whereConditions.push({
      type: 'contains',
      sql: spatialFunctions.contains(geomField, point.toString())
    });
    return this;
  }

  whereIntersects(geomField: string, otherGeom: SQL) {
    this.whereConditions.push({
      type: 'intersects',
      sql: spatialFunctions.intersects(geomField, otherGeom.toString())
    });
    return this;
  }

  whereMbrWithin(geomField: string, bbox: SQL) {
    this.whereConditions.push({
      type: 'mbrWithin',
      sql: spatialFunctions.mbrWithin(geomField, bbox.toString())
    });
    return this;
  }

  whereDistanceWithin(geomField: string, point: SQL, maxDistance: number) {
    this.whereConditions.push({
      type: 'custom',
      sql: sql`${spatialFunctions.distance(geomField, point.toString())} <= ${maxDistance}`
    });
    return this;
  }

  // ORDER BY
  orderBy(field: SQL, direction: 'asc' | 'desc' = 'asc') {
    this.orderByFields.push({ field, direction });
    return this;
  }

  // ORDER BY distance (special case for spatial queries)
  orderByDistance(geomField: string, point: SQL, direction: 'asc' | 'desc' = 'asc') {
    this.orderByFields.push({
      field: spatialFunctions.distance(geomField, point.toString()),
      direction
    });
    return this;
  }

  // LIMIT
  limit(limit: number) {
    this.limitValue = limit;
    return this;
  }

  // OFFSET
  offset(offset: number) {
    this.offsetValue = offset;
    return this;
  }

  // Build the SELECT query
  toSQL(): SQL {
    // Build SELECT clause
    let selectClause: SQL;
    if (this.selectFields.length === 0) {
      selectClause = sql`SELECT *`;
    } else if (this.selectFields.length === 1 && this?.selectFields?.[0]?.expression.toString() === '*') {
      selectClause = sql`SELECT *`;
    } else {
      const selectExpressions = this.selectFields.map(field => {
        if (field.alias) {
          return sql`${field.expression} AS ${sql.identifier(field.alias)}`;
        }
        return field.expression;
      });
      selectClause = sql`SELECT ${selectExpressions.join(', ')}`;
    }

    // Build FROM clause
    const fromClause = sql`FROM ${sql.identifier(this.tableName)}`;

    // Build WHERE clause
    let whereClause: SQL | null = null;
    if (this.whereConditions.length > 0) {
      const conditions = this.whereConditions.map(cond => cond.sql);
      whereClause = sql`WHERE ${conditions.join(' AND ')}`;
    }

    // Build ORDER BY clause
    let orderByClause: SQL | null = null;
    if (this.orderByFields.length > 0) {
      const orderExpressions = this.orderByFields.map(order => {
        return order.direction === 'asc' ? asc(order.field) : desc(order.field);
      });
      orderByClause = sql`ORDER BY ${orderExpressions.join(', ')}`;
    }

    // Build LIMIT clause
    let limitClause: SQL | null = null;
    if (this.limitValue !== undefined) {
      limitClause = sql`LIMIT ${this.limitValue}`;
    }

    // Build OFFSET clause
    let offsetClause: SQL | null = null;
    if (this.offsetValue !== undefined) {
      offsetClause = sql`OFFSET ${this.offsetValue}`;
    }

    // Combine all clauses
    const clauses = [selectClause, fromClause];
    if (whereClause) clauses.push(whereClause);
    if (orderByClause) clauses.push(orderByClause);
    if (limitClause) clauses.push(limitClause);
    if (offsetClause) clauses.push(offsetClause);

    return sql.join(clauses, sql` `);
  }

  // Get the SQL as a string (useful for debugging)
  toSQLString(): string {
    // For testing purposes, we'll return a simplified representation
    return `SELECT * FROM ${this.tableName}`; // This is a placeholder
  }
}
