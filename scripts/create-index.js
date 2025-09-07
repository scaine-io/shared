const fs = require('fs')
const path = require('path')

const srcDir = path.join(__dirname, '../src/')

function getExportFiles(dir, baseDir) {
	let files = []
	for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
		if (entry.isDirectory()) {
			files = files.concat(getExportFiles(path.join(dir, entry.name), baseDir))
		} else if (entry.isFile() && entry.name.endsWith('.ts') && entry.name !== 'index.ts') {
			const relPath = path.relative(baseDir, path.join(dir, entry.name)).replace(/\\/g, '/').replace(/\.ts$/, '')
			files.push(relPath)
		}
	}
	return files
}

function createIndexInFolder(folder) {
	const files = getExportFiles(folder, folder)
	const content = files.map((f) => `export * from './${f}';`).join('\n') + '\n'
	const indexPath = path.join(folder, 'index.ts')
	fs.writeFileSync(indexPath, content)
	console.log(`index.ts created in ${folder} with exports:`, files)
}

function walkFolders(dir, depth = 1, maxDepth = 4) {
	if (depth > maxDepth) return
	for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
		if (entry.isDirectory()) {
			if (entry.name.startsWith('__')) continue
			createIndexInFolder(path.join(dir, entry.name))
			walkFolders(path.join(dir, entry.name), depth + 1, maxDepth)
		}
	}
}

// Create index.ts in src itself
createIndexInFolder(srcDir)
// Create index.ts in all subfolders up to 4 levels
walkFolders(srcDir)
