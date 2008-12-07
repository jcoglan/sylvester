<?php $title = 'Vector and Matrix math for JavaScript'; ?>
<?php include 'header.php'; ?>

<h2>What is it?</h2>

<p>Sylvester is a JavaScript library designed to let you do mathematics with vectors and matrices without having to write lots of loops and throw piles of arrays around. It includes classes for modelling vectors and matrices in any number of dimensions, and for modelling infinite lines and planes in 3-dimensional space. It lets you write object-oriented easy-to-read code that mirrors the maths it represents. For example, it lets you multiply vectors together:</p>

<pre><code>var V1 = $V([3,4,5]);
var V2 = $V([9,-3,0]);

var d = V1.dot(V2);
// d is 15

var c = V1.cross(V2);
// c is the vector (15,45,-45)</code></pre>

<p>and multiply matrices:</p>

<pre><code>var M1 = $M([
  [1,7,3],
  [9,4,0],
  [2,7,1]
]);

var M2 = $M([
  [6,2,8],
  [9,1,3],
  [0,7,6]
]);

var M = M1.x(M2);

// M is the matrix
//   69 30 47
//   90 22 84
//   75 18 43</code></pre>

<p>and any number of other useful arithmetic and geometric operations. For more information, take a look at <a href="<?php echo ROOT.'/docs'; ?>">the API documentation</a>.</p>

<a name="download"></a>
<h2><a href="assets/sylvester-0-1-3.zip">Download version 0.1.3</a></h2>

<p>The download is a ZIP archive containing the following files:</p>

<ul>
  <li><code>sylvester.src.js</code> &ndash; the full source code, with comments (43.8 kb)</li>
  <li><code>sylvester.js</code> &ndash; the <a href="http://dean.edwards.name/packer/">packed</a> version (13.2 kb)</li>
  <li><code>sylvester.js.gz</code> &ndash; a gzipped copy of the packed version (5.0 kb), so you can <a 
href="http://blog.jcoglan.com/2007/05/02/compress-javascript-and-css-without-touching-your-application-code/">serve compressed code</a></li>
  <li><code>CHANGELOG.txt</code></li>
</ul>

<p>Sylvester is &copy; 2007 James Coglan, and is released under the MIT license.</p>

<p>0.1 is the first released version. It consists of the <code>Vector</code>, <code>Matrix</code>, <code>Line</code> and <code>Plane</code> classes &ndash; a useful mathematical base on which to build. Later releases will add components for more specific geometric modelling functionality, building towards a feature-complete 1.0 release. For news and announcements, <a href="http://blog.jcoglan.com">head over to my blog</a>.</p>

<p>Bug reports and feature requests are both welcome at james@jcoglan.com. I am working on extending Sylvester to support line segments, flat polygons and 3-dimensional objects, with a view to building a 3D geometry framework with a rendering layer for the <code>&lt;canvas&gt;</code> element.</p>

<h2>Compatibility</h2>

<p>Sylvester has been successfully tested in Firefox 1.0, 1.5 and 2.0, Internet Explorer 5.5, 6.0 and 7.0, Opera 7, 8 and 9, and Safari 3 for 
Windows.</p> 
<?php include 'footer.php'; ?>
