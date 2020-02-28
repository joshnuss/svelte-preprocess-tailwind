import { parseFragment, serialize } from 'parse5'

import getSelectors from './selectors'

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

export default function preprocessTailwind({content}) {
  const doc = parseFragment(content)

  console.log("****** BEFORE *******")
  console.log(serialize(doc))

  return getSelectors().then(selectors => {
    replace(doc.childNodes, selectors)

    console.log("****** AFTER *******")
    console.log(serialize(doc))

    return {code: serialize(doc)}
  })
}
