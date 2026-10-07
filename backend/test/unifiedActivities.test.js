const test = require('node:test');
const assert = require('node:assert/strict');
const { normalizeEssentialGroups } = require('../src/domain/essentials');
const { mapDestinationRelations } = require('../src/domain/destinationMapping');
test('saving a guide preserves activity identities and shared catalog references', () => {
  const groups = normalizeEssentialGroups([{ title:'Paseos',items:[{id:'stable-item',title:'Paseo',catalogActivityId:'shared-activity'}]}]);
  assert.equal(groups[0].items[0].id,'stable-item');
  assert.equal(groups[0].items[0].catalogActivityId,'shared-activity');
});
test('featured activities resolve current shared fields without exposing internal relations', () => {
  const source = {id:'featured',title:'Old title',description:'Old description',sortOrder:2,catalogActivityId:'shared',catalogActivity:{id:'shared',nombre:'New title',descripcion:'New description',duration:'3 h',imagen:'',website:'',translations:{en:{nombre:'Walk',descripcion:'Shared description'}}}};
  const item=mapDestinationRelations({essentialGroups:[{items:[source]}]}).essentialGroups[0].items[0];
  assert.equal(item.title,'New title');assert.equal(item.description,'New description');assert.equal(item.duration,'3 h');assert.equal(item.sortOrder,2);assert.equal(item.translations.en.title,'Walk');assert.equal(item.catalogActivity,undefined);
  assert.equal(source.title,'Old title');
});
