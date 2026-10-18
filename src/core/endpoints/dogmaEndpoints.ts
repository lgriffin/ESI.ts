import { z } from 'zod';
import { EndpointMap } from './EndpointDefinition';
import { fromOperation } from './fromOperation';
import {
  DogmaAttributeSchema,
  DogmaEffectSchema,
  DogmaDynamicItemSchema,
} from '../../schemas/dogma';

export const dogmaEndpoints = {
  getAttributes: fromOperation('GetDogmaAttributes', {
    responseSchema: z.array(z.number()),
  }),
  getAttributeById: fromOperation('GetDogmaAttributesAttributeId', {
    pathParams: ['attributeId'],
    responseSchema: DogmaAttributeSchema,
  }),
  getEffects: fromOperation('GetDogmaEffects', {
    responseSchema: z.array(z.number()),
  }),
  getEffectById: fromOperation('GetDogmaEffectsEffectId', {
    pathParams: ['effectId'],
    responseSchema: DogmaEffectSchema,
  }),
  getDynamicItemInfo: fromOperation('GetDogmaDynamicItemsTypeIdItemId', {
    pathParams: ['typeId', 'itemId'],
    responseSchema: DogmaDynamicItemSchema,
  }),
} as const satisfies EndpointMap;
