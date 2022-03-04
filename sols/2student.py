#!/usr/bin/python

import sys

src = open(sys.argv[1], 'r')

start = 0
for line in src:
	if line[0:15]=='//#begin_hidden':
		start = 2
	elif line[0:8]=='//#begin':
		print '// ===YOUR CODE STARTS HERE==='
		print ''
		start = 1
	elif line[0:6]=='//#end':
		if start==1:
			print '// ---YOUR CODE ENDS HERE---'
		start = 0
	elif start==0:
		print line,


