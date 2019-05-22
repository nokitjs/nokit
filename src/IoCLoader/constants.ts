/**
 * Provider 注解 metadataKey
 */
export const IOC_PROVIDER = Symbol("IOC_PROVIDER");

/**
 * 成员 inject 注解 metadataKey
 */
export const IOC_PROP_INJECT = Symbol("IOC_PROP_INJECT");

/**
 * 构造 inject 注解 metadataKey
 */
export const IOC_CTOR_INJECT = Symbol("IOC_CTOR_INJECT");

/**
 * 单例 Symbol
 */
export const IOC_SINGLETON = Symbol("IOC_SINGLETON");

/**
 * 容器中的实体类型（object）
 */
export const IOC_ENTITY_OBJ = Symbol("IOC_ENTITY_OBJ");

/**
 * 容器实体类型（class）
 */
export const IOC_ENTITY_CLS = Symbol("IOC_ENTITY_CLS");
