import { sql, type SQL } from 'drizzle-orm';

// Spatial functions for SpatiaLite
export const spatialFunctions = {
  // ST_Contains(geom, point) - Check if geometry contains a point
  contains: (geomColumn: string, point: SQL) => 
    sql`ST_Contains(${sql.identifier(geomColumn)}, ${point})`,
  
  // ST_Distance(geom1, geom2) - Calculate distance between geometries
  distance: (geomColumn: string, point: SQL) => 
    sql`ST_Distance(${sql.identifier(geomColumn)}, ${point})`,
  
  // MakePoint(x, y, srid) - Create a point geometry
  makePoint: (x: number, y: number, srid: number = 4326) => 
    sql`MakePoint(${x}, ${y}, ${srid})`,
  
  // AsGeoJSON(geom) - Convert geometry to GeoJSON
  asGeoJSON: (geomColumn: string) => 
    sql`AsGeoJSON(${sql.identifier(geomColumn)})`,
  
  // MbrWithin(geom, bbox) - Check if geometry's MBR is within bounding box
  mbrWithin: (geomColumn: string, bbox: SQL) => 
    sql`MbrWithin(${sql.identifier(geomColumn)}, ${bbox})`,
  
  // BuildMbr(minx, miny, maxx, maxy, srid) - Build minimum bounding rectangle
  buildMbr: (minx: number, miny: number, maxx: number, maxy: number, srid: number = 4326) => 
    sql`BuildMbr(${minx}, ${miny}, ${maxx}, ${maxy}, ${srid})`,
  
  // ST_Simplify(geom, tolerance) - Simplify geometry
  simplify: (geomColumn: string, tolerance: number) => 
    sql`ST_Simplify(${sql.identifier(geomColumn)}, ${tolerance})`,
};

type SelectField = {
  expression: SQL;
  alias?: string;
};

type WhereCondition = {
  sql: SQL;
};

export class QueryBuilder {
  private tableName: string;
  private selectFields: SelectField[] = [];
  private whereConditions: WhereCondition[] = [];
  private orderByFields: { field: SQL; direction: 'asc' | 'desc' }[] = [];
  private limitValue?: number;

  constructor(tableName: string) {
    this.tableName = tableName;
  }

  // SELECT fields
  select(fields: Record<string, SQL>) {
    this.selectFields = Object.entries(fields).map(([alias, expression]) => ({
      expression,
      alias
    }));
    return this;
  }

  // WHERE conditions
  where(condition: SQL) {
    this.whereConditions.push({ sql: condition });
    return this;
  }

  // WHERE field = value
  whereEquals(field: string, value: any) {
    this.whereConditions.push({
      sql: sql`${sql.identifier(field)} = ${value}`
    });
    return this;
  }

  // WHERE field LIKE pattern
  whereLike(field: string, pattern: string) {
    this.whereConditions.push({
      sql: sql`${sql.identifier(field)} LIKE ${pattern}`
    });
    return this;
  }

  // Spatial WHERE conditions
  whereContains(geomColumn: string, point: SQL) {
    this.whereConditions.push({
      sql: spatialFunctions.contains(geomColumn, point)
    });
    return this;
  }

  whereMbrWithin(geomColumn: string, bbox: SQL) {
    this.whereConditions.push({
      sql: spatialFunctions.mbrWithin(geomColumn, bbox)
    });
    return this;
  }

  // ORDER BY
  orderBy(field: SQL, direction: 'asc' | 'desc' = 'asc') {
    this.orderByFields.push({ field, direction });
    return this;
  }

  // ORDER BY distance
  orderByDistance(geomColumn: string, point: SQL, direction: 'asc' | 'desc' = 'asc') {
    this.orderByFields.push({
      field: spatialFunctions.distance(geomColumn, point),
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
    const fromClause = sql`FROM ${sql.identifier(this.tableName)}`;

    // WHERE clause
    let whereClause: SQL | null = null;
    if (this.whereConditions.length > 0) {
      const conditions = this.whereConditions.map(cond => cond.sql);
      whereClause = sql`WHERE ${conditions.join(' AND ')}`;
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

// Helper function to create a query builder
export function createQueryBuilder(tableName: string) {
  return new QueryBuilder(tableName);
}