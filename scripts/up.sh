#!/bin/bash

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
DOCKER_COMPOSE="docker-compose -f $DIR/../docker-compose.dev.yml"

$DOCKER_COMPOSE up --build api
exit_code=$?
$DOCKER_COMPOSE down
exit $exit_code
