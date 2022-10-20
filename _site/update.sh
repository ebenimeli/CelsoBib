SITEFOLDER=_/site/
if test -f "$SITEFOLDER"; then
    echo "Removing site..."
    rm -r "$FILE"
fi
CACHE=./jekyll-cache/
if test -f "$CACHE"; then
   echo "Deleting cache..."
   rm -r .jekyll-cache/
fi

echo "Pulling..."
git pull

echo "Building..."
bundle exec jekyll build

WEB=/var/www/vhosts/ebenimeli.org/httpdocs/
if test -f "$WEB"; then
  cp -r _site/* "$WEB"
fi
