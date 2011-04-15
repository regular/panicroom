SELECT captureTime,pick,
rating,stackParent_fileName,absolutePath,pathFromRoot,lc_idx_filename FROM
Adobe_images,AgLibraryFile,AgLibraryFolder,AgLibraryRootFolder where (rating
or pick) and AgLibraryFile.id_local = Adobe_images.rootFile and
AgLibraryFolder.id_local=AgLibraryFile.folder and
AgLibraryRootFolder.id_local = AgLibraryFolder.rootFolder;