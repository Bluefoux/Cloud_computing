# Dockerfile
FROM mysql:8.0

# Set a timezone (optional)
ENV TZ=Europe/Stockholm

# --- Runtime DB config via env (set real values at `docker run` time) ---
# Required by the official image: provide at least MYSQL_ROOT_PASSWORD at runtime.

# Optional MySQL server tweaks:
# - utf8mb4 everywhere
# - trust function/trigger creators during init (avoids definer/binlog hassles)
# - make table-name comparisons case-insensitive (helps if your SQL mixes case)
#   NOTE: lower_case_table_names must be set before the data dir is initialized.
RUN printf '%s\n' \
  '[mysqld]' \
  'character-set-server = utf8mb4' \
  'collation-server = utf8mb4_unicode_ci' \
  'log_bin_trust_function_creators = 1' \
  'lower_case_table_names = 1' \
  > /etc/mysql/conf.d/custom.cnf

# Copy your schema to the MySQL init directory so it runs on first container start
# COPY schema.sql /docker-entrypoint-initdb.d/01_schema.sql

EXPOSE 3306
