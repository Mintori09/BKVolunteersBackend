import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const backendDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const distDir = path.join(backendDir, 'dist')
const normalizedDistDir = distDir

const toPosixRelative = (fromDir, targetPath) => {
    const relativePath = path.relative(fromDir, targetPath).replace(/\\/g, '/')
    return relativePath.startsWith('.') ? relativePath : `./${relativePath}`
}

const resolveTargetFile = async (currentFile, specifier) => {
    const currentDir = path.dirname(currentFile)

    if (specifier.startsWith('src/')) {
        const aliasTarget = path.join(normalizedDistDir, specifier)
        const aliasFile = `${aliasTarget}.js`
        const aliasIndex = path.join(aliasTarget, 'index.js')
        if (await awaitExists(aliasFile)) return toPosixRelative(currentDir, aliasFile)
        if (await awaitExists(aliasIndex)) return toPosixRelative(currentDir, aliasIndex)
        return specifier
    }

    if (specifier.startsWith('./') || specifier.startsWith('../')) {
        const baseTarget = path.resolve(currentDir, specifier)
        const directFile = `${baseTarget}.js`
        const directIndex = path.join(baseTarget, 'index.js')
        if (await awaitExists(directFile)) return `${specifier}.js`
        if (await awaitExists(directIndex)) {
            const suffix = specifier.endsWith('/') ? 'index.js' : '/index.js'
            return `${specifier}${suffix}`
        }
    }

    return specifier
}

const existsCache = new Map()
const awaitExists = (targetPath) => {
    if (existsCache.has(targetPath)) {
        return existsCache.get(targetPath)
    }

    const promise = fs
        .access(targetPath)
        .then(() => true)
        .catch(() => false)

    existsCache.set(targetPath, promise)
    return promise
}

const rewriteSpecifiers = async (filePath) => {
    const original = await fs.readFile(filePath, 'utf8')

    const patterns = [
        /(from\s*['"])([^'"]+)(['"])/g,
        /(import\s*\(\s*['"])([^'"]+)(['"]\s*\))/g,
    ]

    const replacements = []

    for (const pattern of patterns) {
        for (const match of original.matchAll(pattern)) {
            const [fullMatch, prefix, specifier, suffix] = match
            if (
                specifier.startsWith('node:') ||
                specifier.startsWith('@') ||
                specifier.startsWith('http://') ||
                specifier.startsWith('https://') ||
                specifier.endsWith('.js') ||
                specifier.endsWith('.json')
            ) {
                continue
            }

            const resolvedSpecifier = await resolveTargetFile(filePath, specifier)
            if (resolvedSpecifier === specifier) {
                continue
            }

            replacements.push({
                start: match.index,
                end: match.index + fullMatch.length,
                value: `${prefix}${resolvedSpecifier}${suffix}`,
            })
        }
    }

    let rewritten = original
    for (const replacement of replacements.sort((left, right) => right.start - left.start)) {
        rewritten =
            rewritten.slice(0, replacement.start) +
            replacement.value +
            rewritten.slice(replacement.end)
    }

    if (rewritten !== original) {
        await fs.writeFile(filePath, rewritten, 'utf8')
    }
}

const walk = async (directory) => {
    const entries = await fs.readdir(directory, { withFileTypes: true })
    const files = []

    for (const entry of entries) {
        const fullPath = path.join(directory, entry.name)
        if (entry.isDirectory()) {
            files.push(...(await walk(fullPath)))
            continue
        }

        if (entry.isFile() && fullPath.endsWith('.js')) {
            files.push(fullPath)
        }
    }

    return files
}

const main = async () => {
    const files = await walk(normalizedDistDir)
    for (const file of files) {
        await rewriteSpecifiers(file)
    }

    console.log(`Rewrote dist imports for ${files.length} files`)
}

await main()
