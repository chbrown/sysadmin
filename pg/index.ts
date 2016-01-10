// PostgreSQL information_schema types
export type sql_identifier = string;
export type character_data = string;
export type name = string;
export type integer = number;
export type yes_or_no = string; // 'YES' | 'NO'
export type cardinal_number = number;
/** object identifier */
export type oid = number;
/** transaction "xact" identifier */
export type xid = number;
/** Access privileges (I think it's a string) */
export type aclitem = string;


/** Table "information_schema.tables" */
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

/** Table "information_schema.columns" */
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
