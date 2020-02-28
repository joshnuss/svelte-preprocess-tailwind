import postcss from 'postcss'
import tailwind from 'tailwindcss'

export default function selectors() {
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
