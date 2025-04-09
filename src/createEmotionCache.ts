// src/createEmotionCache.ts
import createCache from '@emotion/cache';

/**
 * key를 'css'로 하고, prepend 옵션을 true로 설정하면
 * MUI의 스타일이 다른 스타일보다 우선순위가 높게 적용됩니다.
 */
export default function createEmotionCache() {
    return createCache({ key: 'css', prepend: true });
}
