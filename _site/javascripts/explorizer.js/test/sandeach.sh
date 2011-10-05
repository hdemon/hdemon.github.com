#! /bin/bash

cd src
ls=`ls`
rm ../new
mkdir ../new

for file in $ls
do
	echo $file
	cat $1 $file $2 >> ../new/$file
done

cd ..
