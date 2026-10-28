// core/validator/ValidatorTypes.ts

export type RuleHandler = (
    value: any,
    params: string[],
    data: Record<string, any>,
    field: string
) => boolean | Promise<boolean>;

export type RuleMessageResolver = (field: string, params: string[]) => string;

export interface RuleDefinition {
    handler: RuleHandler;
    defaultMessage: RuleMessageResolver;
}