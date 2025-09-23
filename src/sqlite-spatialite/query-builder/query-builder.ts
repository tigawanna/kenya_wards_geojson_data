import { sql, type SQL } from 'drizzle-orm';
import { type SQLiteTable } from 'drizzle-orm/sqlite-core';
import { type InferSelectModel } from 'drizzle-orm';

// Spatial functions for SpatiaLite
export const spatialFunctions = {
  // ST_Contains(geom, point) - Check if geometry contains a point
  contains: (geomColumn: SQL, point: SQL) => 
    sql`ST_Contains(${geomColumn}, ${point})`,
  
  // ST_Distance(geom1, geom2) - Calculate distance between geometries
  distance: (geomColumn: SQL, point: SQL) => 
    sql`ST_Distance(${geomColumn}, ${point})`,
  
  // MakePoint(x, y, srid) - Create a point geometry
  makePoint: (x: number, y: number, srid: number = 4326) => 
    sql`MakePoint(${x}, ${y}, ${srid})`,
  
  // AsGeoJSON(geom) - Convert geometry to GeoJSON
  asGeoJSON: (geomColumn: SQL) => 
    sql`AsGeoJSON(${geomColumn})`,
  
  // MbrWithin(geom, bbox) - Check if geometry's MBR is within bounding box
  mbrWithin: (geomColumn: SQL, bbox: SQL) => 
    sql`MbrWithin(${geomColumn}, ${bbox})`,
  
  // BuildMbr(minx, miny, maxx, maxy, srid) - Build minimum bounding rectangle
  buildMbr: (minx: number, miny: number, maxx: number, maxy: number, srid: number = 4326) => 
    sql`BuildMbr(${minx}, ${miny}, ${maxx}, ${maxy}, ${srid})`,
  
  // ST_Simplify(geom, tolerance) - Simplify geometry
  simplify: (geomColumn: SQL, tolerance: number) => 
    sql`ST_Simplify(${geomColumn}, ${tolerance})`,
};

// Helper type to extract column names from a table
type ColumnName<T extends SQLiteTable> = keyof T['_']['columns'];

// Typesafe query builder that uses Drizzle table schema
export class QueryBuilder<T extends SQLiteTable, TResult = InferSelectModel<T>> {
  private table: T;
  private selectFields: { expression: SQL; alias?: string }[] = [];
  private whereConditions: SQL[] = [];
  private orderByFields: { field: SQL; direction: 'asc' | 'desc' }[] = [];
  private limitValue?: number;

  constructor(table: T) {
    this.table = table;
  }

  // Typesafe SELECT fields
  select<TSelected extends Record<string, SQL>>(fields: TSelected): QueryBuilder<T, TSelected> {
    this.selectFields = Object.entries(fields).map(([alias, expression]) => ({
      expression,
      alias
    }));
    return this as unknown as QueryBuilder<T, TSelected>;
  }

  // SELECT all fields
  selectAll(): QueryBuilder<T, InferSelectModel<T>> {
    this.selectFields = [{ expression: sql`*` }];
    return this as QueryBuilder<T, InferSelectModel<T>>;
  }

  // WHERE conditions
  where(condition: SQL) {
    this.whereConditions.push(condition);
    return this;
  }

  // Typesafe WHERE field = value
  whereEquals<K extends ColumnName<T>>(field: K, value: any) {
    const column = (this.table as any)[field];
    this.whereConditions.push(sql`${column} = ${value}`);
    return this;
  }

  // Typesafe WHERE field LIKE pattern
  whereLike<K extends ColumnName<T>>(field: K, pattern: string) {
    const column = (this.table as any)[field];
    this.whereConditions.push(sql`${column} LIKE ${pattern}`);
    return this;
  }

  // Spatial WHERE conditions
  whereContains<K extends ColumnName<T>>(geomField: K, point: SQL) {
    const column = (this.table as any)[geomField];
    this.whereConditions.push(spatialFunctions.contains(column, point));
    return this;
  }

  whereMbrWithin<K extends ColumnName<T>>(geomField: K, bbox: SQL) {
    const column = (this.table as any)[geomField];
    this.whereConditions.push(spatialFunctions.mbrWithin(column, bbox));
    return this;
  }

  // ORDER BY
  orderBy<K extends ColumnName<T>>(field: K, direction: 'asc' | 'desc' = 'asc') {
    const column = (this.table as any)[field];
    this.orderByFields.push({ field: column, direction });
    return this;
  }

  // ORDER BY with SQL expression
  orderBySql(field: SQL, direction: 'asc' | 'desc' = 'asc') {
    this.orderByFields.push({ field, direction });
    return this;
  }

  // ORDER BY distance
  orderByDistance<K extends ColumnName<T>>(geomField: K, point: SQL, direction: 'asc' | 'desc' = 'asc') {
    const column = (this.table as any)[geomField];
    this.orderByFields.push({
      field: spatialFunctions.distance(column, point),
      direction
    });
    return this;
  }

  // LIMIT
  limit(limit: number) {
    this.limitValue = limit;
    return this;
  }

  // Build the SQL query
  toSQL(): SQL {
    // SELECT clause
    let selectClause: SQL;
    if (this.selectFields.length === 0) {
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

    // FROM clause
    const tableName = (this.table as any)[Symbol.for('drizzle:Name')] as string;
    const fromClause = sql`FROM ${sql.identifier(tableName)}`;

    // WHERE clause
    let whereClause: SQL | null = null;
    if (this.whereConditions.length > 0) {
      whereClause = sql`WHERE ${this.whereConditions.join(' AND ')}`;
    }

    // ORDER BY clause
    let orderByClause: SQL | null = null;
    if (this.orderByFields.length > 0) {
      const orderExpressions = this.orderByFields.map(order => {
        return order.direction === 'asc' 
          ? sql`${order.field} ASC`
          : sql`${order.field} DESC`;
      });
      orderByClause = sql`ORDER BY ${orderExpressions.join(', ')}`;
    }

    // LIMIT clause
    let limitClause: SQL | null = null;
    if (this.limitValue !== undefined) {
      limitClause = sql`LIMIT ${this.limitValue}`;
    }

    // Combine all clauses
    const clauses = [selectClause, fromClause];
    if (whereClause) clauses.push(whereClause);
    if (orderByClause) clauses.push(orderByClause);
    if (limitClause) clauses.push(limitClause);

    return sql.join(clauses, sql` `);
  }
}

// Helper function to create a typesafe query builder
export function createQueryBuilder<T extends SQLiteTable>(table: T) {
  return new QueryBuilder<T>(table);
}
