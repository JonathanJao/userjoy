#!/bin/bash

set -e

echo 'Adding do, app.do, api.do, cdn.do, demo.do to /etc/hosts'

ETCHOSTFILE=/etc/hosts
ETCHOSTURL=127.0.0.1
declare -a DOHOSTS=( "do.localhost" "app.do.localhost" "api.do.localhost" "cdn.do.localhost" "demo.do.localhost" "www.do.localhost" "www.app.do.localhost" "www.api.do.localhost" "www.cdn.do.localhost" "www.demo.do.localhost" )

for host in "${DOHOSTS[@]}"
do
  FULLHOST="$ETCHOSTURL $host"

  # check if host is already present in /etc/hosts
  # if not present add it
  if ! grep -i "$FULLHOST" $ETCHOSTFILE; then
    sudo echo $FULLHOST >> $ETCHOSTFILE
  else
    echo $FULLHOST already exists in hosts file
  fi
done

exit 0
