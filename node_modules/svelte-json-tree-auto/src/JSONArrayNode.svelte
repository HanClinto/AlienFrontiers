<script>
  import JSONNested from './JSONNested.svelte';

  export let key, value, isParentExpanded, isParentArray;
  export let expanded = JSON.stringify(value).length < 1024;
  const filteredKey = new Set(['length']);

  $: keys = Object.getOwnPropertyNames(value);
  $: previewKeys = keys.filter(key => !filteredKey.has(key));

  function getValue(key) {
    return value[key];
  }

</script>
<JSONNested
  {key}
  {expanded}
  {isParentExpanded}
  {isParentArray}
  isArray={true}
  {keys}
  {previewKeys}
  {getValue}
  label="Array({value.length})"
  bracketOpen="["
  bracketClose="]"
/>