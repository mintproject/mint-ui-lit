#!/bin/sh

# Decrypt the file
mkdir $HOME/secrets
gpg --quiet --batch --yes --decrypt --passphrase="$LARGE_SECRET_PASSPHRASE" \
--output $HOME/secrets/config.json config.json.gpg
cp config.json src/config/
