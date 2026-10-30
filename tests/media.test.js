import {test} from 'node:test';
import assert from 'node:assert/strict';
import {imageAttributes} from '../public/media.js';
import dimensions from '../public/image-dimensions.json' with {type:'json'};
test('every local image has positive intrinsic sizes and defaults to deferred decoding',()=>{
 for(const [src,size] of Object.entries(dimensions)){
  assert.ok(size.width>0&&size.height>0);
  assert.match(imageAttributes(src),/width="\d+" height="\d+" loading="lazy" decoding="async"/);
  assert.match(imageAttributes(src,{priority:true}),/loading="eager"/);
 }
 assert.throws(()=>imageAttributes('/assets/missing.webp'),/Missing intrinsic/);
});
