/*! PostgreSQL information_schema types. Some of these comments are taken
verbatim from the PostgreSQL documentation:
http://www.postgresql.org/docs/current/static/infoschema-datatypes.html

Every column in the information schema has one of these five types:
  cardinal_number, character_data, sql_identifier, time_stamp, yes_or_no
*/
/** A nonnegative integer. */
export type cardinal_number = number;
/** A character string (without specific maximum length). */
export type character_data = string;
/** A character string. This type is used for SQL identifiers, the type
character_data is used for any other kind of text data. */
export type sql_identifier = string;
/** A domain over the type timestamp with time zone */
export type time_stamp = Date;
/** A character string domain that contains either YES or NO. This is used to represent Boolean (true/false) data in the information schema. (The information schema was invented before the type boolean was added to the SQL standard, so this convention is necessary to keep the information schema backward compatible.) */
export type yes_or_no = string; // 'YES' | 'NO'

/** View "information_schema.tables" */
export interface InformationSchemaTable {
  table_catalog:                 sql_identifier;
  table_schema:                  sql_identifier;
  table_name:                    sql_identifier;
  table_type:                    character_data;
  self_referencing_column_name?: sql_identifier;
  reference_generation?:         character_data;
  user_defined_type_catalog?:    sql_identifier;
  user_defined_type_schema?:     sql_identifier;
  user_defined_type_name?:       sql_identifier;
  is_insertable_into?:           yes_or_no;
  is_typed?:                     yes_or_no;
  commit_action?:                character_data;
}

/** View "information_schema.columns" */
export interface InformationSchemaColumn {
  table_catalog:             sql_identifier;
  table_schema:              sql_identifier;
  table_name:                sql_identifier;
  column_name:               sql_identifier;
  ordinal_position:          cardinal_number;
  column_default:            character_data;
  is_nullable:               yes_or_no;
  data_type:                 character_data;
  character_maximum_length?: cardinal_number;
  character_octet_length?:   cardinal_number;
  numeric_precision?:        cardinal_number;
  numeric_precision_radix?:  cardinal_number;
  numeric_scale?:            cardinal_number;
  datetime_precision?:       cardinal_number;
  interval_type?:            character_data;
  interval_precision?:       cardinal_number;
  character_set_catalog?:    sql_identifier;
  character_set_schema?:     sql_identifier;
  character_set_name?:       sql_identifier;
  collation_catalog?:        sql_identifier;
  collation_schema?:         sql_identifier;
  collation_name?:           sql_identifier;
  domain_catalog?:           sql_identifier;
  domain_schema?:            sql_identifier;
  domain_name?:              sql_identifier;
  udt_catalog:               sql_identifier;
  udt_schema:                sql_identifier;
  udt_name:                  sql_identifier;
  scope_catalog?:            sql_identifier;
  scope_schema?:             sql_identifier;
  scope_name?:               sql_identifier;
  maximum_cardinality?:      cardinal_number;
  dtd_identifier:            sql_identifier;
  is_self_referencing:       yes_or_no;
  is_identity:               yes_or_no;
  identity_generation?:      character_data;
  identity_start?:           character_data;
  identity_increment?:       character_data;
  identity_maximum?:         character_data;
  identity_minimum?:         character_data;
  identity_cycle?:           yes_or_no;
  is_generated:              character_data;
  generation_expression?:    character_data;
  is_updatable:              yes_or_no;
}

/** View "information_schema.referential_constraints"

The most interesting columns are constraint_name and unique_constraint_name, e.g.,

| constraint_name                   | unique_constraint_name | update_rule | delete_rule |
|-----------------------------------|------------------------|-------------|-------------|
| experiments_administrator_id_fkey | administrators_pkey    | NO ACTION   | CASCASE     |
| responses_participant_id_fkey     | participants_pkey      | NO ACTION   | CASCASE     |

The first is a result of the following column declaration:

    CREATE TABLE experiments (
      administrator_id INTEGER REFERENCES administrators(id) ON DELETE CASCADE NOT NULL,
      ...
    );

However, to link those constraint_names back to the original tables, you have to
refer to the information_schema.key_column_usage table.
*/
export interface InformationSchemaReferentialConstraint {
  /** Name of the database containing the constraint (always the current database) */
  constraint_catalog:        sql_identifier;
  /** Name of the schema containing the constraint */
  constraint_schema:         sql_identifier;
  /** Name of the constraint */
  constraint_name:           sql_identifier;
  /** Name of the database that contains the unique or primary key constraint that the foreign key constraint references (always the current database) */
  unique_constraint_catalog: sql_identifier;
  /** Name of the schema that contains the unique or primary key constraint that the foreign key constraint references */
  unique_constraint_schema:  sql_identifier;
  /** Name of the unique or primary key constraint that the foreign key constraint references */
  unique_constraint_name:    sql_identifier;
  /** Match option of the foreign key constraint: FULL, PARTIAL, or NONE. */
  match_option:              character_data;
  /** Update rule of the foreign key constraint: CASCADE, SET NULL, SET DEFAULT, RESTRICT, or NO ACTION. */
  update_rule:               character_data;
  /** Delete rule of the foreign key constraint: CASCADE, SET NULL, SET DEFAULT, RESTRICT, or NO ACTION. */
  delete_rule:               character_data;
}

/** View "information_schema.key_column_usage"

Continuing with the example from the referential_constraints comment, you can
link those constraints back to their tables and columns via this table:

| constraint_name                   | table_name     | column_name      |
|-----------------------------------|----------------|------------------|
| experiments_administrator_id_fkey | experiments    | administrator_id |
| responses_participant_id_fkey     | responses      | participant_id   |
| administrators_pkey               | administrators | id               |
| participants_pkey                 | participants   | id               |
*/
export interface InformationSchemaKeyColumnUsage {
  /** Name of the database that contains the constraint (always the current database) */
  constraint_catalog:            sql_identifier;
  /** Name of the schema that contains the constraint */
  constraint_schema:             sql_identifier;
  /** Name of the constraint */
  constraint_name:               sql_identifier;
  /** Name of the database that contains the table that contains the column that is restricted by this constraint (always the current database) */
  table_catalog:                 sql_identifier;
  /** Name of the schema that contains the table that contains the column that is restricted by this constraint */
  table_schema:                  sql_identifier;
  /** Name of the table that contains the column that is restricted by this constraint */
  table_name:                    sql_identifier;
  /** Name of the column that is restricted by this constraint */
  column_name:                   sql_identifier;
  /** Ordinal position of the column within the constraint key (count starts at 1) */
  ordinal_position:              cardinal_number;
  /** For a foreign-key constraint, ordinal position of the referenced column within its unique constraint (count starts at 1); otherwise null */
  position_in_unique_constraint: cardinal_number;
}

/*!
PostgreSQL pg_catalog types.

http://www.postgresql.org/docs/current/static/catalogs.html
*/
export type name = string;
export type integer = number;
/** object identifier */
export type oid = number;
/** transaction "xact" identifier */
export type xid = number;
/** Access privileges (I think it's a string) */
export type aclitem = string;

/** Table "pg_catalog.pg_database" */
export interface PgCatalogPgDatabase {
  datname:       name;
  datdba:        oid;
  encoding:      integer;
  datcollate:    name;
  datctype:      name;
  datistemplate: boolean;
  datallowconn:  boolean;
  datconnlimit:  integer;
  datlastsysoid: oid;
  datfrozenxid:  xid;
  datminmxid:    xid;
  dattablespace: oid;
  datacl?:       aclitem[];
}

/*******************************************************************************
                                pg types
*******************************************************************************/

/** Also called "field description".
See https://github.com/brianc/node-postgres/blob/v4.4.3/lib/connection.js#L468
*/
export interface PgField {
  name: string;
  tableID: number;
  columnID: number;
  dataTypeID: number;
  dataTypeSize: number;
  dataTypeModifier: number;
  format: string;
}

export interface PgQueryResult<T> {
  command: string;
  rowCount: number;
  oid: number;
  rows: T[];
  fields: PgField[];
  RowCtor: Function;
  rowAsArray: boolean;
}

export interface PgConnectionConfig {
  user?: string;
  database?: string;
  password?: string;
  port?: number;
  host?: string;
  ssl?: boolean;
}

export interface API {
  databases(params?: PgConnectionConfig):
    Promise<PgQueryResult<PgCatalogPgDatabase>>;
  tables(params: PgConnectionConfig & {database: string}):
    Promise<PgQueryResult<InformationSchemaTable>>;
  table(params: PgConnectionConfig & {database: string;
                                      table: string;
                                      filters?: {[index: string]: string | string[]}}):
    Promise<PgQueryResult<{[index: string]: string}>>;
  columns(params: PgConnectionConfig & {database: string; tables: string[]}):
    Promise<PgQueryResult<InformationSchemaColumn>>;
  query<T>(params: PgConnectionConfig & {sql: string; variables: any[]}):
    Promise<PgQueryResult<T>>;
}
