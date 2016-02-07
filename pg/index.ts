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

/*******************************************************************************
  pg_catalog types: http://www.postgresql.org/docs/current/static/catalogs.html
*******************************************************************************/

export type name = string;
export type text = string;
export type integer = number;
export type int4 = number;
export type int2 = number;
export type bool = boolean;
export type char = string;
export type pg_node_tree = string;
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

/** Table "pg_catalog.pg_tables" (http://www.postgresql.org/docs/current/static/view-pg-tables.html) */
export interface PgCatalogPgTable {
  /** Name of schema containing table (references pg_namespace.nspname) */
  schemaname:  name;
  /** Name of table (references pg_class.relname) */
  tablename:   name;
  /** Name of table's owner (references pg_authid.rolname) */
  tableowner:  name;
  /** Name of tablespace containing table (null if default for database) (references pg_tablespace.spcname) */
  tablespace:  name;
  /** True if table has (or recently had) any indexes (references pg_class.relhasindex) */
  hasindexes:  boolean;
  /** True if table has (or once had) rules (references pg_class.relhasrules) */
  hasrules:    boolean;
  /** True if table has (or once had) triggers (references pg_class.relhastriggers) */
  hastriggers: boolean;
  /** True if row security is enabled on the table (references pg_class.relrowsecurity) */
  rowsecurity: boolean;
}

/** Table "pg_catalog.pg_attribute" (http://www.postgresql.org/docs/current/static/catalog-pg-attribute.html) */
export interface PgCatalogPgAttribute {
  /** The table this column belongs to (references pg_class.oid) */
  attrelid: oid;
  /** The column name */
  attname: name;
  /** The data type of this column (references pg_type.oid).
  Can be cast to 'regtype' to get a generic string representation.
  */
  atttypid: oid;
  /** attstattarget controls the level of detail of statistics accumulated for this column by ANALYZE. A zero value indicates that no statistics should be collected. A negative value says to use the system default statistics target. The exact meaning of positive values is data type-dependent. For scalar data types, attstattarget is both the target number of "most common values" to collect, and the target number of histogram bins to create. */
  attstattarget: int4;
  /** A copy of pg_type.typlen of this column's type */
  attlen: int2;
  /** The number of the column. Ordinary columns are numbered from 1 up. System columns, such as oid, have (arbitrary) negative numbers. */
  attnum: int2;
  /** Number of dimensions, if the column is an array type; otherwise 0. (Presently, the number of dimensions of an array is not enforced, so any nonzero value effectively means "it's an array".) */
  attndims: int4;
  /** Always -1 in storage, but when loaded into a row descriptor in memory this might be updated to cache the offset of the attribute within the row */
  attcacheoff: int4;
  /** atttypmod records type-specific data supplied at table creation time (for example, the maximum length of a varchar column). It is passed to type-specific input functions and length coercion functions. The value will generally be -1 for types that do not need atttypmod. */
  atttypmod: int4;
  /** A copy of pg_type.typbyval of this column's type */
  attbyval: bool;
  /** Normally a copy of pg_type.typstorage of this column's type. For TOAST-able data types, this can be altered after column creation to control storage policy. */
  attstorage: char;
  /** A copy of pg_type.typalign of this column's type */
  attalign: char;
  /** This represents a not-null constraint. */
  attnotnull: bool;
  /** This column has a default value, in which case there will be a corresponding entry in the pg_attrdef catalog that actually defines the value. */
  atthasdef: bool;
  /** This column has been dropped and is no longer valid. A dropped column is still physically present in the table, but is ignored by the parser and so cannot be accessed via SQL. */
  attisdropped: bool;
  /** This column is defined locally in the relation. Note that a column can be locally defined and inherited simultaneously. */
  attislocal: bool;
  /** The number of direct ancestors this column has. A column with a nonzero number of ancestors cannot be dropped nor renamed. */
  attinhcount: int4;
  /** The defined collation of the column, or zero if the column is not of a collatable data type. (references pg_collation.oid) */
  attcollation: oid;
  /** Column-level access privileges, if any have been granted specifically on this column */
  attacl: aclitem[];
  /** Attribute-level options, as "keyword=value" strings */
  attoptions: text[];
  /** Attribute-level foreign data wrapper options, as "keyword=value" strings */
  attfdwoptions: text[];
}

export interface PgCatalogPgConstraint {
  /** Row identifier (hidden attribute; must be explicitly selected) */
  oid: oid;
  /** Constraint name (not necessarily unique!) */
  conname: name;
  /** The OID of the namespace that contains this constraint (references pg_namespace.oid) */
  connamespace: oid;
  /** c = check constraint, f = foreign key constraint, p = primary key constraint, u = unique constraint, t = constraint trigger, x = exclusion constraint */
  contype: char;
  /** Is the constraint deferrable? */
  condeferrable: bool;
  /** Is the constraint deferred by default? */
  condeferred: bool;
  /** Has the constraint been validated? Currently, can only be false for foreign keys and CHECK constraints */
  convalidated: bool;
  /** The table this constraint is on; 0 if not a table constraint (references pg_class.oid) */
  conrelid: oid;
  /** The domain this constraint is on; 0 if not a domain constraint (references pg_type.oid) */
  contypid: oid;
  /** The index supporting this constraint, if it's a unique, primary key, foreign key, or exclusion constraint; else 0 (references pg_class.oid) */
  conindid: oid;
  /** If a foreign key, the referenced table; else 0 (references pg_class.oid) */
  confrelid: oid;
  /** Foreign key update action code: a = no action, r = restrict, c = cascade, n = set null, d = set default */
  confupdtype: char;
  /** Foreign key deletion action code: a = no action, r = restrict, c = cascade, n = set null, d = set default */
  confdeltype: char;
  /** Foreign key match type: f = full, p = partial, s = simple */
  confmatchtype: char;
  /** This constraint is defined locally for the relation. Note that a constraint can be locally defined and inherited simultaneously. */
  conislocal: bool;
  /** The number of direct inheritance ancestors this constraint has. A constraint with a nonzero number of ancestors cannot be dropped nor renamed. */
  coninhcount: int4;
  /** This constraint is defined locally for the relation. It is a non-inheritable constraint. */
  connoinherit: bool;
  /** If a table constraint (including foreign keys, but not constraint triggers), list of the constrained columns (references pg_attribute.attnum) */
  conkey: int2[];
  /** If a foreign key, list of the referenced columns (references pg_attribute.attnum) */
  confkey: int2[];
  /** If a foreign key, list of the equality operators for PK = FK comparisons (references pg_operator.oid) */
  conpfeqop: oid[];
  /** If a foreign key, list of the equality operators for PK = PK comparisons (references pg_operator.oid) */
  conppeqop: oid[];
  /** If a foreign key, list of the equality operators for FK = FK comparisons (references pg_operator.oid) */
  conffeqop: oid[];
  /** If an exclusion constraint, list of the per-column exclusion operators (references pg_operator.oid) */
  conexclop: oid[];
  /** If a check constraint, an internal representation of the expression */
  conbin: pg_node_tree;
  /** If a check constraint, a human-readable representation of the expression */
  consrc: text;
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
  /** Corresponds to the oid of table pg_catalog.pg_type */
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

/*******************************************************************************
                         custom (hydrated) types
*******************************************************************************/

export interface RelationAttribute {
  attname: string;
  attnum: number;
  atttyp: string;
  attnotnull: boolean;
  adsrc?: string;
}
export interface RelationConstraint {
  /** constraint name (not necessarily unique) */
  conname: string;
  /** one of: 'check constraint', 'foreign key constraint',
  'primary key constraint', 'unique constraint', 'constraint trigger',
  'exclusion constraint' */
  contype: string;
  /** 1-based indices of the constrained columns */
  conkey: number[];
  /** name of the foreign-referenced relation */
  confrelname: string;
  /** name of the attributes (columns) on the foreign relation */
  fkeyattnames: string;
}
export interface Relation {
  relid: string;
  relname: string;
  /** one of: 'ordinary table', 'index', 'sequence', 'view',
  'materialized view', 'composite type', 'TOAST table', 'foreign table' */
  relkind: string;
  attributes: RelationAttribute[];
  constraints: RelationConstraint[];
}
