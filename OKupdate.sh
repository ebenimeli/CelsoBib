#!/bin/bash
BASE=/home/ebenimeli/GitHub/CelsoBib
SITEFOLDER="$BASE/_site/"
IMAC="/Users/ebenimeli/Documents/GitHub/CelsoBib"
MACBOOK="/Users/Quique/Documents/GitHub/CelsoBib"
SERVER="/home/ebenimeli/GitHub/CelsoBib"

echo "Site folder: $SITEFOLDER"
if [[ -d "$SITEFOLDER" ]]; then
    echo "Removing site..."
    rm -r "$SITEFOLDER"
else
    echo "No _site folder found!"
fi
CACHE="$BASE/.jekyll-cache/"
echo "Cache folder: $CACHE"
if [[ -d "$CACHE" ]]; then
   echo "Deleting cache..."
   rm -r "$CACHE"
else
    echo "No cache folder!"
fi

echo "Pulling..."
git pull

echo "Building..."

if test -f "/bin/bundle3.0"; then
  BUNDLE_GEMFILE="$SERVER/Gemfile" /bin/bundle3.0 exec jekyll build /home/ebenimeli/GitHub/CelsoBib/
else
  if [[ -d "$IMAC" ]]; then
    echo "iMac ..."
    BUNDLE_GEMFILE="$IMAC/Gemfile" bundle exec jekyll build $IMAC
  else
    echo "MacBook ..."
    BUNDLE_GEMFILE="$MACBOOK/Gemfile" bundle exec jekyll build $MACBOOK
  fi
fi

WEB=/var/www/vhosts/ebenimeli.org/httpdocs
if [[ -d "$WEB" ]]; then
  echo "Copying web to $WEB ..."
  cp -r /home/ebenimeli/GitHub/CelsoBib/_site/* "$WEB"
fi
