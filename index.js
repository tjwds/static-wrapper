const fs = require('fs')
const showdown = require('showdown')
const path = require('path')

const converter = new showdown.Converter()
const cwd = process.cwd();

const templates = {
    page: null,
}

const createDirIfDNE = fullPath => {
    if (!fs.existsSync(fullPath)){
        fs.mkdirSync(fullPath);
    }
}

const walkFileAndCreateDir = file => {
    let makeDir = path.join(cwd, 'build')
    file.split('/').forEach((dir, index, array) => {
        makeDir = path.join(makeDir, dir)
        if (index !== array.length - 1) {
            createDirIfDNE(path.join(makeDir))
        }
    })
}

const createTemplatedHTML = file => {
    const fileContent = fs.readFileSync(file,  "utf8")
    const html = converter.makeHtml(fileContent)
    // TODO:  some sort of liquid support for navigation?
    if (templates.page) {
        return templates.page(fileContent.split('\n')[0], html)
    }
    return html;
}

const processFile = file => {
    const relativePath = file.split(cwd)[1].slice(1)
    // recursively create dir if it doesn't exist
    // XXX would it be better to do this while walking the files?
    walkFileAndCreateDir(relativePath)
    const html = createTemplatedHTML(relativePath)
    // TODO:  RSS feed
    fs.writeFileSync(
        path.join(cwd, 'build', relativePath.replace('.md', '.html')),
        html,
    )
}

const walkFiles = (currentDir, fn) => {
    fs.readdirSync(currentDir).forEach(file => {
        if (file.startsWith('.') || file.startsWith('templates')) {
            return
        }
        const currentTest = path.join(currentDir, file)
        if (fs.statSync(currentTest).isDirectory()) {
            walkFiles(currentTest, fn)
        } else {
            fn(currentTest)
        }
      });
}

createTemplates = cwd => {
    if (!fs.existsSync(path.join(cwd, 'templates'))){
        return;
    }
    // todo:  make this a loop for all the page templates
    const filePath = path.join(cwd, 'templates', 'page.html')
    if (fs.existsSync(filePath)) {
        const templateContent = fs.readFileSync(filePath,  "utf8")
        // TODO:  make this smarter w/ regex
        templates.page = (title, content) =>
            templateContent.replace('{{ title }}', title)
            .replace('{{ content }}', content)
    }
    // copy static template files over
    createDirIfDNE(path.join(cwd, 'tools'))
    createDirIfDNE(path.join(cwd, 'build', '.templates'));
    ['preamble.html'].forEach(template => {
        const filePath = path.join(cwd, 'templates', template)
        if (fs.existsSync(filePath)) {
            fs.copyFileSync(filePath, path.join(cwd, 'build', '.templates', template))
        }
    })
}

// create build dir if it doesn't exist
createDirIfDNE(path.join(cwd, 'build'))
createTemplates(cwd)

walkFiles(cwd, processFile)
