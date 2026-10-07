// Checks run in one transaction, and always roll back: no fixture survives.
const assert = require('node:assert/strict');
const { randomUUID } = require('node:crypto');
const { prisma, pool } = require('../src/config/database');
const { saveCatalogRecord } = require('../src/services/municipalityCatalogService');
const { listUnifiedActivities } = require('../src/services/unifiedActivityService');
const { normalizeEssentialGroups } = require('../src/domain/essentials');
const { syncDestinationEssentials } = require('../src/services/adminService');
const { mapDestinationRelations } = require('../src/domain/destinationMapping');
const rollback = new Error('ROLLBACK_UNIFIED_CHECK');
async function run() {
  let checked = false;
  try { await prisma.$transaction(async tx => {
    const label = 'Unified check ' + randomUUID();
    const destinationData = {nombre:label,tipoTurismoPrincipal:'',tipoTurismoSecundario:'',presupuesto:'',masificacion:'',mesesJulioAgosto:0,mesesNovAbril:0,mesesMayJunSeptOct:0,ubicacion:'',descripcion:'',imprescindibles:'',imagen:'',editorialStatus:'published'};
    const first = await tx.destino.create({data:destinationData});
    const second = await tx.destino.create({data:{...destinationData,nombre:label+' second'}});
    const source = await tx.essentialGroup.create({data:{destinoId:first.id,title:'Original group',items:{create:{id:randomUUID(),title:label,description:'Preserved original text',translations:{en:{title:'English title'}}}}},include:{items:true}});
    const item = source.items[0];
    const originalRows = await listUnifiedActivities(tx,{q:label});
    assert.equal(originalRows.length,1); assert.equal(originalRows[0].id,'source_'+item.id);
    const canonical = await saveCatalogRecord(tx,'actividades',{...originalRows[0],nombre:label+' edited'},originalRows[0].id);
    assert.equal(canonical.essentialItemId,item.id);
    const unified = await listUnifiedActivities(tx,{q:label});assert.equal(unified.length,1);assert.equal(unified[0].id,canonical.id);
    const groups = normalizeEssentialGroups([{title:'Featured',items:[{id:randomUUID(),title:canonical.nombre,catalogActivityId:canonical.id}]}]);
    await syncDestinationEssentials(tx,second.id,groups);
    await saveCatalogRecord(tx,'actividades',{...canonical,descripcion:'Shared edited description',nombre:label+' shared'},canonical.id);
    const other = await tx.destino.findUnique({where:{id:second.id},include:{essentialGroups:{include:{items:{include:{catalogActivity:{include:{essentialItem:true}}}}}}}});
    assert.equal(mapDestinationRelations(other).essentialGroups[0].items[0].description,'Shared edited description');
    const retained = normalizeEssentialGroups([{title:source.title,items:[{...item,title:label+' updated in guide',description:'Updated guide description'}]}]);
    await syncDestinationEssentials(tx,first.id,retained);
    assert.equal((await tx.experience.findUnique({where:{id:canonical.id}})).essentialItemId,item.id);
    await syncDestinationEssentials(tx,first.id,[]);
    const detached = await tx.experience.findUnique({where:{id:canonical.id}});
    assert.equal(detached.essentialItemId,null);assert.equal(detached.descripcion,'Updated guide description');assert.equal(detached.translations.en.nombre,'English title');
    assert.equal(await tx.essentialItem.count({where:{catalogActivityId:canonical.id}}),1);
    checked = true; throw rollback;
  },{timeout:60000}); } catch(error){if(error.message!==rollback.message)throw error;}
  assert.ok(checked); console.log('Unified listing, single-source editing, multi-destination reuse, stable references and preservation verified. All writes rolled back.');
}
run().catch(error=>{console.error(error.message);process.exitCode=1;}).finally(async()=>{await prisma.$disconnect();await pool.end();});
