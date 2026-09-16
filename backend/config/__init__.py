try:
    import pymysql
    pymysql.install_as_MySQLdb()
except ImportError:
    pass

# Patch Django database version check for XAMPP MariaDB 10.4.x compatibility
from django.db.backends.base.base import BaseDatabaseWrapper
BaseDatabaseWrapper.check_database_version_supported = lambda self: None

# MariaDB < 10.5 does not support INSERT ... RETURNING syntax
from django.db.backends.mysql.features import DatabaseFeatures
DatabaseFeatures.can_return_columns_from_insert = property(
    lambda self: self.connection.mysql_is_mariadb and self.connection.mysql_version >= (10, 5, 0)
)

# MariaDB 10.4 does not support RENAME COLUMN, uses CHANGE COLUMN instead
from django.db.backends.mysql.schema import DatabaseSchemaEditor
DatabaseSchemaEditor.sql_rename_column = "ALTER TABLE %(table)s CHANGE COLUMN %(old_column)s %(new_column)s %(type)s"
