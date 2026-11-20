import { describe, expect, it } from 'vitest';
import { productSentence, shortDeviceName } from '@/lib/format';

describe('short device names', () => {
  it('uses the first complete anchor name', () => expect(shortDeviceName('Smith and Nephew Suture Anchors - 5.0mm Absorbable Polymer Anchor, Smith and Nephew Suture Anchors - TAG Bioraptor…')).toBe('Smith and Nephew Suture Anchors - 5.0mm Absorbable Polymer Anchor'));
  it('keeps the shoulder name unchanged', () => expect(shortDeviceName('EQUINOXE REVERSE SHOULDER SYSTEM')).toBe('EQUINOXE REVERSE SHOULDER SYSTEM'));
  it('drops ultrasound model lists', () => expect(shortDeviceName('GE LOGIQ E9 BT2010 DIAGNOSTIC ULTRASOUND SYSTEM, MODEL 5205000-3, 5205000-4')).toBe('GE LOGIQ E9 BT2010 DIAGNOSTIC ULTRASOUND SYSTEM'));
  it('keeps commas in short names', () => expect(shortDeviceName('KNEE, TOTAL, FEMORAL & TIBIAL')).toBe('KNEE, TOTAL, FEMORAL & TIBIAL'));
  it('removes an incomplete parenthetical', () => expect(shortDeviceName('Identity Imprint Knee Replacement System (including Identity Imprint Femoral Components and …)')).toBe('Identity Imprint Knee Replacement System…'));
  it('normalizes spaces and trailing punctuation', () => expect(shortDeviceName('  Shoulder   System ; ')).toBe('Shoulder System'));
  it('honors a custom limit at a word boundary', () => expect(shortDeviceName('One two three four five six', 15)).toBe('One two three…'));
});

describe('product description sentences', () => {
  it('joins the anchor procedures', () => expect(productSentence('A biodegradable anchor or fastener that attaches tendon or ligament to bone.', ['Rotator cuff', 'Labral', 'Ligament', 'Tendon repair'])).toBe('A biodegradable anchor or fastener that attaches tendon or ligament to bone, used in rotator cuff, labral, ligament and tendon repair.'));
  it('includes the shoulder procedure', () => expect(productSentence('A reverse-configuration shoulder replacement for joints with a deficient rotator cuff.', 'Reverse total shoulder arthroplasty (rTSA)')).toBe('A reverse-configuration shoulder replacement for joints with a deficient rotator cuff, used in reverse total shoulder arthroplasty (rTSA).'));
  it('preserves an all-capitals first word', () => expect(productSentence('An implant', ['ACL reconstruction', 'Knee repair'])).toBe('An implant, used in ACL reconstruction and knee repair.'));
  it('adds only one period without procedures', () => expect(productSentence('An implant.')).toBe('An implant.'));
  it('adds procedures to the FDA fallback', () => expect(productSentence('Cleared by FDA as Soft-tissue anchor, absorbable.', 'Rotator cuff repair')).toBe('Cleared by FDA as Soft-tissue anchor, absorbable, used in rotator cuff repair.'));
});