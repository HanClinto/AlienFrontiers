import assert from "node:assert/strict";
import test from "node:test";

import { CCLayer, CCNode, CCSprite, ccp } from "../js/cocos/core.js";
import { CCEaseSineInOut, CCMoveTo } from "../js/cocos/actions.js";

function assertPoint(actual, expected) {
  assert.ok(Math.abs(actual.x - expected.x) < 0.000001, `${actual.x} != ${expected.x}`);
  assert.ok(Math.abs(actual.y - expected.y) < 0.000001, `${actual.y} != ${expected.y}`);
}

test("sprites use Cocos-style center anchors", () => {
  const sprite = new CCSprite(200, 80).setPosition(384, 600);

  assertPoint(sprite.convertToWorldSpace(ccp(0, 0)), ccp(284, 560));
  assertPoint(sprite.convertToNodeSpace(ccp(484, 640)), ccp(200, 80));
  assert.equal(sprite.containsWorldPoint(ccp(384, 600)), true);
  assert.equal(sprite.containsWorldPoint(ccp(500, 600)), false);
});

test("parent translation, scale, rotation, and anchors compose", () => {
  const layer = new CCLayer().setPosition(20, 30).setScale(2);
  const sprite = new CCSprite(100, 40).setPosition(50, 60);
  sprite.rotation = 90;
  layer.addChild(sprite);

  const worldPoint = sprite.convertToWorldSpace(ccp(50, 20));
  assertPoint(worldPoint, ccp(120, 150));
  assertPoint(sprite.convertToNodeSpace(worldPoint), ccp(50, 20));
});

test("later and higher-z children win hit testing", () => {
  const root = new CCNode();
  const lower = new CCSprite(100, 100).setPosition(50, 50);
  const higher = new CCSprite(100, 100).setPosition(50, 50);
  lower.interactive = true;
  higher.interactive = true;
  root.addChild(lower, 1);
  root.addChild(higher, 2);

  assert.equal(root.findTopmostNodeAt(ccp(50, 50), (node) => node.interactive), higher);
});

test("Cocos touch priority is independent from visual z-order", () => {
  const root = new CCNode();
  const menuItem = new CCSprite(100, 100).setPosition(50, 50);
  const ship = new CCSprite(100, 100).setPosition(50, 50);
  menuItem.interactive = true;
  menuItem.touchPriority = -128;
  ship.interactive = true;
  root.addChild(menuItem, 1);
  root.addChild(ship, 10);

  assert.equal(root.findTopmostNodeAt(ccp(50, 50), (node) => node.interactive), menuItem);
});

test("sine-eased movement reaches the original Cocos destination", () => {
  const node = new CCNode();
  node.runAction(new CCEaseSineInOut(new CCMoveTo(1, ccp(10, 20))));
  node.update(0.25);
  assert.ok(node.position.x > 1 && node.position.x < 2);
  assert.ok(node.position.y > 2 && node.position.y < 4);
  node.update(0.75);
  assertPoint(node.position, ccp(10, 20));
});