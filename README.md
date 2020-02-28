# Tailwind Preprocess for Svelte.js

**This is a prototype**

This preprocessor helps organize how you use Tailwind with Svelte.

# Setup

```javascript
import preprocessTailwind from 'svelte-preprocess-tailwind'


// add as a markup preprocessor in svelte plugin config
svelte({
  preprocessor: {
    markup: preprocessTailwind
  }
  ....
})
```

# Examples

## Attributes

Instead of using classes, you can use attributes:

```html
<a text-bold/>

<!-- equivalent to: -->
<a class="text-bold"/>
```

## Groups

Multiple classes of the same modifier (`hover`, `focus`) or breakpoint (`sm`, `md`, `lg`, `xl`) can be grouped together using brackets:

```html
<a hover:(text-bold,underline) md:(text-xl,font-medium)/>

<!-- equivalent to: -->
<a class="hover:text-bold hover:underline md:text-xl md:font-medium"/>
```

## Attribute conditions

Conditions can be added to each attribute:

```html
<a text-bold={isActive}/>

<!-- equivalent to: -->
<a class:text-bold={isActive}/>
```

## Group conditions

Conditions can be added to an entire group:

```html
<a (text-bold,underline)={isActive}/>
<a hover:(text-bold,underline)={isActive}/>
<a md:(text-bold,underline)={isActive}/>
<a hover:(text-bold,underline) hover:no-underline={isActive}/>

<!-- equivalent to: -->
<a class={isActive ? 'text-bold underline' : ''}/>
<a class={isActive ? 'hover:text-bold hover:underline' : ''}/>
<a class={isActive ? 'md:text-bold md:underline' : ''}/>
<a class="hover:text-bold hover:underline {isActive ? 'hover:no-underline' : ''}"/>

```

# License

MIT
