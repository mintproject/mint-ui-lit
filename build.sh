#!/bin/sh
if [[ $TRAVIS_BRANCH == 'master' ]]; then
    yarn run create-build
else
    yarn create-build-dev
fi
