const { File, verify } = require('megajs');
const { join } = require('path');
const fs = require('fs').promises;
const { orderBy } = require('natural-orderby');

// Function to download a MEGA file or folder
async function megaDownloader(url, folderPath = join(process.cwd() + '/temp')) {
    try {
        try {
            await fs.access(folderPath);
        } catch (error) {
            // Folder does not exist
            await fs.mkdir(folderPath, { recursive: true });
            console.log(`Creating ${folderPath} folder...`);
        }
        
        const mainFile = File.fromURL(url);
        mainFile.api.userAgent = 'MEGAJS-Demos (+https://mega.js.org/)';

        const selectedNode = await mainFile.loadAttributes();
        if (!selectedNode.name) throw Error('You should include the decryption key!');

        const downloadedFiles = await downloadFile(selectedNode, folderPath);
        return {
            creator: '@ShiroNexo',
            status: true,
            data: {
                result: downloadedFiles
            }
        }
    } catch (error) {
        console.error(error);
        return {
            creator: '@ShiroNexo',
            status: false,
            message: error.message || 'An error occurred while downloading the file.'
        }
    }
}

// Recursive function to download files and folders
async function downloadFile(megaFile, folderPath) {
    let downloadedFiles = [];

    if (megaFile.directory) {
        const childFolderPath = join(folderPath, megaFile.name);
        const childFolderStats = await fs.stat(childFolderPath).catch(() => null);
        if (!childFolderStats) {
            await fs.mkdir(childFolderPath);
        } else if (!childFolderStats.isDirectory) {
            throw Error(`${childFolderPath} is not a directory!`);
        }

        const sortedChildren = orderBy(megaFile.children, e => e.name);
        for (const child of sortedChildren) {
            const childDownloadedFiles = await downloadFile(child, childFolderPath);
            downloadedFiles = downloadedFiles.concat(childDownloadedFiles);
        }
        return downloadedFiles;
    }

    const filePath = join(folderPath, megaFile.name);
    const fileStats = await fs.stat(filePath).catch(() => null);

    if (fileStats && fileStats.size >= megaFile.size) {
        console.log(`${megaFile.name} was already downloaded`);
        downloadedFiles.push(filePath);
        return downloadedFiles;
    }

    console.log(`Downloading ${megaFile.name} into "${folderPath}"`);
    if (fileStats) console.log(`Continuing interrupted download at ${fileStats.size} bytes`);

    const fileHandle = fileStats ? await fs.open(filePath, 'a') : await fs.open(filePath, 'w');
    const writer = fileHandle.createWriteStream({ start: fileStats ? fileStats.size : 0 });

    const downloadStream = await megaFile.download({ start: fileStats ? fileStats.size : 0 });
    downloadStream.pipe(writer);

    await new Promise((resolve, reject) => {
        writer.on('finish', resolve);
        writer.on('error', reject);
    });

    await fileHandle.close();

    if (fileStats) {
        const isFileValid = await verifyFile(filePath, megaFile);
        if (isFileValid) {
            console.log(`${filePath} has been downloaded and verified`);
        } else {
            console.log(`${filePath} is corrupt`);
            await fs.rename(filePath, `${filePath}.corrupt`);
        }
    } else {
        console.log(`${filePath} has been downloaded`);
    }

    downloadedFiles.push(filePath);
    return downloadedFiles;
}

// Function to verify the downloaded file
async function verifyFile(filePath, megaFile) {
    const fileHandle = await fs.open(filePath, 'r');
    const reader = fileHandle.createReadStream();
    const verifyStream = verify(megaFile.key);

    reader.pipe(verifyStream);

    return new Promise((resolve) => {
        verifyStream.on('end', () => resolve(false));
        verifyStream.on('error', () => resolve(true));
    });
}

// Export the downloadMegaFile function
module.exports = megaDownloader