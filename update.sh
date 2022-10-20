#!/bin/bash
BASE=/home/ebenimeli/GitHub/CelsoBib
SITEFOLDER="$BASE/_site/"
echo "Site folder: $SITEFOLDER"
if [[ -d "$SITEFOLDER" ]]; then
    echo "Removing site..."
    rm -r "$SITEFOLDER"
else
    echo "No _site folder!"
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
BUNDLE_GEMFILE=/home/ebenimeli/GitHub/CelsoBib/Gemfile bundle exec jekyll build /home/ebenimeli/GitHub/CelsoBib/

WEB=/var/www/vhosts/ebenimeli.org/httpdocs
if [[ -d "$WEB" ]]; then
  echo "Copying web to $WEB ..."
  cp -r /home/ebenimeli/GitHub/CelsoBib/_site/* "$WEB"
fi
