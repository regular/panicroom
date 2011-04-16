** panicroom is a backup tool for Adobe Lightroom **

This is work in progress

## PURPOSE

I tend to not backup my raw images as often as I should. One of the reasons is the massive amount of data that has to be moved to backup a large collection of images. To make backups faster, I could start deleting photos from the library. However I'd like to stick with my policy of never deleting any frame I ever shot.
A solution would be to only backup the 'good' photos. If the other's are eventually lost, I would probably be able to get over it. Some day.

## TODO

- lists absolute paths of master images in a lightroom catalog
- filters this list by RootFolder, Flags and Rating
- uses rsync to copy referenced files to a save place
- moves local files to a remote file server for archiving (this requires write access to the Lightroom catalog and is therefor dangerous)

## LICENSE

(MIT license)

Copyright (c) 2011 Jan Bölsche <regular.gonzales@googlemail.com>

Permission is hereby granted, free of charge, to any person obtaining
a copy of this software and associated documentation files (the
"Software"), to deal in the Software without restriction, including
without limitation the rights to use, copy, modify, merge, publish,
distribute, sublicense, and/or sell copies of the Software, and to
permit persons to whom the Software is furnished to do so, subject to
the following conditions:

The above copyright notice and this permission notice shall be
included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE
LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION
OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION
WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.