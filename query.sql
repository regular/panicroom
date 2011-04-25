SELECT captureTime,pick,
rating,absolutePath,pathFromRoot,lc_idx_filename FROM
Adobe_images,AgLibraryFile,AgLibraryFolder,AgLibraryRootFolder where AgLibraryFile.id_local = Adobe_images.rootFile and
AgLibraryFolder.id_local=AgLibraryFile.folder and
AgLibraryRootFolder.id_local = AgLibraryFolder.rootFolder;