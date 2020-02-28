import svelte from 'rollup-plugin-svelte';
import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import livereload from 'rollup-plugin-livereload';
import { terser } from 'rollup-plugin-terser';

import postcss from 'postcss'
import tailwind from 'tailwindcss'

import { parseFragment, serialize } from 'parse5'

function getSelectors() {
  return postcss(tailwind())
    .process("@tailwind utilities;")
    .then(result => {
      const {nodes} = result.root
      const rules = []

      nodes.forEach(node => {
        if (node.type === 'rule') {
          rules.push(node)
        } else if (node.type === 'atrule' && node.name === 'media') {
          node.nodes.forEach(x => rules.push(x))
        }
      })

      return rules
        .filter(n => n.selector)
        .map(n => {
          return n.selector
            .replace(/^\./, '')
            .replace('\\', '')
            .replace(/\:focus$/, '')
            .replace(/\:hover$/, '')
        })
    })
}

function replace(nodes, selectors) {
  return nodes.map(node => {
    if (node.attrs == []) return
    if (node.nodeName == '#text') return

    const {classes, others} = extract(node.attrs, selectors)

    node.attrs = others

    if (classes.length > 0) {
      let cssClass = ''

      classes.forEach(({type,  attr}) => {
        if (type === 'dynamic') {
          const expression = attr.value.split(/\{|\}/)[1]
          cssClass += `{${expression} ? ' ${attr.name}' : ''} `
        } else {
          cssClass += attr.name + ' '
        }
      })

      node.attrs.push({name: 'class', value: cssClass.trim()})
    }

    if (node.childNodes) {
      replace(node.childNodes, selectors)
    }

    return node
  })
}

function extract(attrs, selectors) {
  const others = []
  const classes = []

  attrs.forEach(attr => {
    const {name, value} = attr
    let names
    const parts = name.split(':')
    let modifier = parts.length > 1 ? parts[0] : null

    if (name.indexOf(',') > -1) {
      if (modifier) {
        names = parts[1].split(',')
      }
      else {
        names = parts[0].split(',')
      }
    }
    else {
      modifier = null
      names = [name]
    }

    names.forEach(name => {
      const fullName = modifier ? `${modifier}:${name}` : name
      const fullAttr = {name: fullName, value}

      if (selectors.indexOf(fullName) > -1) {
        if (!value) {
          classes.push({type: 'static', attr: fullAttr})
        } else {
          classes.push({type: 'dynamic', attr: fullAttr})
        }
      } else {
        others.push(fullAttr)
      }
    })
  })

  return {others, classes}
}

function preprocessTailwind({content}) {
  const doc = parseFragment(content)

  console.log(doc.childNodes[2])
  console.log(serialize(doc))

  return getSelectors().then(selectors => {
    replace(doc.childNodes, selectors)

    console.log(serialize(doc))

    return {code: serialize(doc)}
  })
}

const production = !process.env.ROLLUP_WATCH;

export default {
  input: 'src/main.js',
  output: {
    sourcemap: true,
    format: 'iife',
    name: 'app',
    file: 'public/build/bundle.js'
  },
  plugins: [
    svelte({
      preprocess: {
        markup: preprocessTailwind
      },

      // enable run-time checks when not in production
      dev: !production,
      // we'll extract any component CSS out into
      // a separate file - better for performance
      css: css => {
        css.write('public/build/bundle.css');
      }
    }),

    // If you have external dependencies installed from
    // npm, you'll most likely need these plugins. In
    // some cases you'll need additional configuration -
    // consult the documentation for details:
    // https://github.com/rollup/plugins/tree/master/packages/commonjs
    resolve({
      browser: true,
      dedupe: ['svelte']
    }),
    commonjs(),

    // In dev mode, call `npm run start` once
    // the bundle has been generated
    !production && serve(),

    // Watch the `public` directory and refresh the
    // browser on changes when not in production
    !production && livereload('public'),

    // If we're building for production (npm run build
    // instead of npm run dev), minify
    production && terser()
  ],
  watch: {
    clearScreen: false
  }
};

function serve() {
  let started = false;

  return {
    writeBundle() {
      if (!started) {
        started = true;

        require('child_process').spawn('npm', ['run', 'start', '--', '--dev'], {
          stdio: ['ignore', 'inherit', 'inherit'],
          shell: true
        });
      }
    }
  };
}
