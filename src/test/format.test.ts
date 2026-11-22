import { describe, expect, it } from 'vitest';
import { companyName, displayName, productSentence, shortDeviceName } from '@/lib/format';

describe('display names', () => {
  it('title-cases FDA names without correcting filed spelling', () => {
    expect(displayName('DEPUY ATTUNE KNEE SYSTEM - CEMENTLESS CR AND PS FEMORAL COMPONENETS')).toBe('Depuy Attune Knee System - Cementless CR and PS Femoral Componenets');
  });
  it('preserves the hyphenated company exception', () => expect(displayName('SI-BONE, INC.')).toBe('SI-BONE, Inc.'));
  it('leaves mixed-case names unchanged', () => expect(displayName('Mako Total Knee Application')).toBe('Mako Total Knee Application'));
  it('requires more than four letters', () => expect(displayName('BONE')).toBe('BONE'));
  it('includes exactly 80 percent uppercase letters', () => expect(displayName('ABCDx')).toBe('Abcdx'));
  it('leaves names below 80 percent unchanged', () => expect(displayName('ABCxy')).toBe('ABCxy'));
  it('preserves every specified uppercase token', () => {
    const tokens = 'CR PS PS2 HA PEEK MIS ALIF LLIF TLIF PLIF XLIF ACL PCL PK UHMWPE TKA THA UKA SI USA US II III IV 3D AR MR CT NTAP';
    expect(displayName(`SYSTEM ${tokens}`)).toBe(`System ${tokens}`);
  });
  it('preserves digit-bearing words', () => expect(displayName('SYSTEM MODEL2 3D 510K')).toBe('System MODEL2 3D 510K'));
  it('title-cases both sides of ordinary hyphens', () => expect(displayName('BONE-ANCHOR SYSTEM')).toBe('Bone-Anchor System'));
  it('keeps small words lowercase except the first word', () => {
    expect(displayName('THE SYSTEM AND OR OF FOR THE WITH TO IN BONE')).toBe('The System and or of for the with to in Bone');
  });
  it('preserves punctuation and whitespace', () => expect(displayName('  BONE,  ANCHOR (SYSTEM).')).toBe('  Bone,  Anchor (System).'));
});

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
 describe('company display names', () => {
  it('removes the compound company suffix', () => expect(companyName('GS Medical Co., Ltd.')).toBe('GS Medical'));
  it('handles a comma without a space', () => expect(companyName('Corentec America,Inc.')).toBe('Corentec America'));
  it('preserves SI-BONE when removing Inc', () => expect(companyName('SI-BONE, INC.')).toBe('SI-BONE'));
  it('repeats suffix removal', () => expect(companyName('Medical Corporation, LLC')).toBe('Medical'));
  it('keeps suffix-like words inside names', () => expect(companyName('Inc Medical, Research')).toBe('Inc Medical, Research'));
  it.each(['Inc', 'Incorporated', 'LLC', 'L.L.C.', 'Ltd', 'Limited', 'Private Limited', 'Pvt. Ltd', 'GmbH & Co. KG', 'GmbH', 'Corp', 'Corporation', 'Co., Ltd', 'Co. Ltd', 'Co Ltd', 'S.A.S.', 'S.A. de C.V.', 'S.A.', 'S.R.L.', 'S.p.A.', 'B.V.', 'N.V.', 'NV', 'AG', 'SAS', 'Pty Ltd', 'Pty', 'L.P.', 'LP', 'ULC', 'UC', 'PLC', 'SE'])('removes trailing %s with or without its final period', suffix => {
    expect(companyName(`Medical, ${suffix}`)).toBe('Medical');
    expect(companyName(`Medical ${suffix.replace(/\.$/, '')}`)).toBe('Medical');
  });
 });
 describe('device acronyms and trademarks', () => {
  it('preserves PFN in parentheses', () => expect(displayName('PROXIMAL FEMORAL NAIL (PFN) SYSTEM')).toBe('Proximal Femoral Nail (PFN) System'));
  it('preserves USA in parentheses', () => expect(displayName('SYNTHES (USA)')).toBe('Synthes (USA)'));
  it('preserves unlisted short parenthetical acronyms', () => expect(displayName('NAIL (ABCD) SYSTEM')).toBe('Nail (ABCD) System'));
  it('replaces a mixed-case trademark marker', () => expect(displayName('NextAR(TM) Spine')).toBe('NextAR™ Spine'));
  it('replaces lowercase trademark and registered markers', () => expect(displayName('NextAR(tm) Spine(R)')).toBe('NextAR™ Spine®'));
  it('preserves the additional uppercase tokens', () => {
    const tokens = 'PFN PFNA DBM PMMA CMF TMJ VBR IBF PSI ACDF OLIF UKA MP EBI HA CT MRI';
    expect(displayName(`SYSTEM ${tokens}`)).toBe(`System ${tokens}`);
  });
 });
