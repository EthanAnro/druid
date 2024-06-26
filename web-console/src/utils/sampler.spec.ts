/*
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import type { SampleResponse } from './sampler';
import { changeLookupInExpressionsSampling, guessDimensionsFromSampleResponse } from './sampler';

describe('sampler', () => {
  describe('getInferredDimensionsFromSampleResponse', () => {
    const sampleResponse: SampleResponse = {
      numRowsRead: 20,
      numRowsIndexed: 20,
      logicalDimensions: [
        {
          type: 'long',
          name: 'isRobot',
          multiValueHandling: 'SORTED_ARRAY',
          createBitmapIndex: false,
        },
        {
          type: 'string',
          name: 'channel',
          multiValueHandling: 'SORTED_ARRAY',
          createBitmapIndex: true,
        },
        {
          type: 'string',
          name: 'flags',
          multiValueHandling: 'SORTED_ARRAY',
          createBitmapIndex: true,
        },
        {
          type: 'long',
          name: 'isUnpatrolled',
          multiValueHandling: 'SORTED_ARRAY',
          createBitmapIndex: false,
        },
      ],
      physicalDimensions: [
        {
          type: 'json',
          name: 'isRobot',
          multiValueHandling: 'SORTED_ARRAY',
          createBitmapIndex: true,
        },
        {
          type: 'json',
          name: 'channel',
          multiValueHandling: 'SORTED_ARRAY',
          createBitmapIndex: true,
        },
        {
          type: 'json',
          name: 'flags',
          multiValueHandling: 'SORTED_ARRAY',
          createBitmapIndex: true,
        },
        {
          type: 'json',
          name: 'isUnpatrolled',
          multiValueHandling: 'SORTED_ARRAY',
          createBitmapIndex: true,
        },
      ],
      logicalSegmentSchema: [
        { name: '__time', type: 'LONG' },
        { name: 'isRobot', type: 'LONG' },
        { name: 'channel', type: 'STRING' },
        { name: 'flags', type: 'STRING' },
        { name: 'isUnpatrolled', type: 'LONG' },
      ],
      data: [
        {
          input: {
            isRobot: true,
            channel: '#sv.wikipedia',
            timestamp: '2016-06-27T00:00:11.080Z',
            flags: 'NB',
            isUnpatrolled: false,
          },
          parsed: {
            __time: 1466985611080,
            isRobot: true,
            channel: '#sv.wikipedia',
            flags: 'NB',
            isUnpatrolled: false,
          },
        },
      ],
    };

    it('works', () => {
      expect(guessDimensionsFromSampleResponse(sampleResponse)).toMatchInlineSnapshot(`
        [
          {
            "name": "isRobot",
            "type": "string",
          },
          {
            "createBitmapIndex": true,
            "multiValueHandling": "SORTED_ARRAY",
            "name": "channel",
            "type": "string",
          },
          {
            "createBitmapIndex": true,
            "multiValueHandling": "SORTED_ARRAY",
            "name": "flags",
            "type": "string",
          },
          {
            "name": "isUnpatrolled",
            "type": "string",
          },
        ]
      `);
    });
  });

  describe('changeLookupInExpressionsSampling', () => {
    it('does nothing when there is nothing to do', () => {
      expect(changeLookupInExpressionsSampling(`concat("x", 'lol')`)).toEqual(`concat("x", 'lol')`);
    });

    it('works with a SQL parsable expression', () => {
      expect(
        changeLookupInExpressionsSampling(`concat(lookup("x", 'lookup_name'), 'lol')`),
      ).toEqual(
        `concat(concat('lookup_name', '[', "x", '] -- This is a placeholder, lookups are not supported in sampling'), 'lol')`,
      );

      expect(
        changeLookupInExpressionsSampling(`concat(lookup("x", 'lookup_name', 'fallback'), 'lol')`),
      ).toEqual(
        `concat(nvl(concat('lookup_name', '[', "x", '] -- This is a placeholder, lookups are not supported in sampling'), 'fallback'), 'lol')`,
      );

      expect(
        changeLookupInExpressionsSampling(
          `concat(lookup("x", 'lookup_name', 'fallback', '?'), 'lol')`,
        ),
      ).toEqual(`concat(null, 'lol')`);
    });

    it('works with a non-SQL parsable expression', () => {
      expect(
        changeLookupInExpressionsSampling(`concat(lookup("x", 'lookup_name'), 'lol')^`),
      ).toEqual(
        `concat(concat('lookup_name','[',"x",'] -- This is a placeholder, lookups are not supported in sampling'), 'lol')^`,
      );

      expect(
        changeLookupInExpressionsSampling(`concat(lookup("x", 'lookup_name', 'fallback'), 'lol')^`),
      ).toEqual(
        `concat(nvl(concat('lookup_name','[',"x",'] -- This is a placeholder, lookups are not supported in sampling'),'fallback'), 'lol')^`,
      );

      expect(
        changeLookupInExpressionsSampling(
          `concat(lookup("x", 'lookup_name', 'fallback', '?'), 'lol')^`,
        ),
      ).toEqual(`concat(null, 'lol')^`);
    });
  });
});
