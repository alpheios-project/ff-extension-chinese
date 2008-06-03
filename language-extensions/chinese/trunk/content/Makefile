all:	clean hanzi.dat simp.idx trad.idx

clean:
	@echo Cleaning...
	@rm hanzi.dat

hanzi.dat:	Unihan.txt.gz hanzi.dat.filter
	@echo Extracting data...
	@gzip -d -c Unihan.txt.gz | egrep -f hanzi.dat.filter | sort > hanzi.dat

simp.idx: simp.input
	@echo Sorting simplified index
	@dos2unix < simp.input | sort -t, -k2,2 -n | sort -t, -s -k1,1 > simp.idx

trad.idx: trad.input
	@echo Sorting traditional index
	@dos2unix < trad.input | sort -t, -k2,2 -n | sort -t, -s -k1,1 > trad.idx
