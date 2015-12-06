#!/bin/bash
rm -rf out || exit 0;
mkdir out;
( cd out
  echo "git init"
  git init
  echo "git config user.name "Benjamin J. Kruger""
  git config user.name "Benjamin J. Kruger"
  git config user.email "bekroogle@gmail.com"
  cp ../index.html ./index.html
  cp ../js ./ -r
  cp ../stylesheets ./ -r
  cp ../CNAME ./CNAME
  cp ../bower_components ./bower_components -r
  echo "git add ."
  git add .
  echo "git commit -m 'Deployed to Github Pages'"
  git commit -m "Deployed to Github Pages"
  echo "git push --force..."
  git push --force  "https://${secure}@${GH_REF}" master:gh-pages > /dev/null 2>&1
)
