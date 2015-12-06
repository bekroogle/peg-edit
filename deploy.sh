#!/bin/bash
rm -rf out || exit 0;
mkdir out;
( cd out
  git init
  git config user.name "Benjamin J. Kruger"
  git config user.email "bekroogle@gmail.com"
  cp ../index.html ./index.html
  cp ../js ./ -r
  cp ../stylesheets ./ -r
  cp ../CNAME ./CNAME
  cp ../bower_components ./bower_components -r
  git add .
  git commit -m "Deployed to Github Pages"
  git push --force --quiet "https://${secure}@${GH_REF}" master:gh-pages > /dev/null 2>&1
)
