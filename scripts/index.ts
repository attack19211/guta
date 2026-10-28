import { Command } from './types';

import { MakeMigrationCommand } from './make/MakeMigrationCommand';
import { MakeControllerCommand } from './make/MakeControllerCommand';
import { MakeModelCommand } from './make/MakeModelCommand';
import { MakeMiddlewareCommand } from './make/MakeMiddlewareCommand';
import { MakeCommandCommand } from './make/MakeCommandCommand';
import { MakeSeederCommand } from './make/MakeSeederCommand';
import { MakeFactoryCommand } from './make/MakeFactoryCommand';
import { MakeProviderCommand } from './make/MakeProviderCommand';
import { MakeViewCommand } from './make/MakeViewCommand';
import { MakeEventCommand } from './make/MakeEventCommand';
import { MakeListenerCommand } from './make/MakeListenerCommand';
import { MakeJobCommand } from './make/MakeJobCommand';
import { MakeNotificationCommand } from './make/MakeNotificationCommand';
import { MakeRequestCommand } from './make/MakeRequestCommand';
import { MakeResourceCommand } from './make/MakeResourceCommand';
import { MakeRuleCommand } from './make/MakeRuleCommand';
import { MakePolicyCommand } from './make/MakePolicyCommand';
import { MakeCastCommand } from './make/MakeCastCommand';
import { MakeExceptionCommand } from './make/MakeExceptionCommand';
import { MakeEnumCommand } from './make/MakeEnumCommand';
import { MakeInterfaceCommand } from './make/MakeInterfaceCommand';
import { MakeTraitCommand } from './make/MakeTraitCommand';
import { MakeScopeCommand } from './make/MakeScopeCommand';
import { MakeTestCommand } from './make/MakeTestCommand';
import { MakeChannelCommand } from './make/MakeChannelCommand';
import { MakeMailCommand } from './make/MakeMailCommand';

import { MigrateCommand } from './database/MigrateCommand';
import { MigrateRollbackCommand } from './database/MigrateRollbackCommand';
import { MigrateResetCommand } from './database/MigrateResetCommand';
import { MigrateRefreshCommand } from './database/MigrateRefreshCommand';
import { MigrateFreshCommand } from './database/MigrateFreshCommand';
import { MigrateStatusCommand } from './database/MigrateStatusCommand';

import { DbSeedCommand } from './database/DbSeedCommand';
import { DbWipeCommand } from './database/DbWipeCommand';
import { DbMonitorCommand } from './database/DbMonitorCommand';
import { DbShowCommand } from './database/DbShowCommand';
import { DbTableCommand } from './database/DbTableCommand';

import { KeyGenerateCommand } from './system/KeyGenerateCommand';
import { AboutCommand } from './system/AboutCommand';

export const commands: Command[] = [
    new MakeMigrationCommand(),
    new MakeControllerCommand(),
    new MakeModelCommand(),
    new MakeMiddlewareCommand(),
    new MakeCommandCommand(),
    new MakeSeederCommand(),
    new MakeFactoryCommand(),
    new MakeProviderCommand(),
    new MakeViewCommand(),
    new MakeEventCommand(),
    new MakeListenerCommand(),
    new MakeJobCommand(),
    new MakeNotificationCommand(),
    new MakeRequestCommand(),
    new MakeResourceCommand(),
    new MakeRuleCommand(),
    new MakePolicyCommand(),
    new MakeCastCommand(),
    new MakeExceptionCommand(),
    new MakeEnumCommand(),
    new MakeInterfaceCommand(),
    new MakeTraitCommand(),
    new MakeScopeCommand(),
    new MakeTestCommand(),
    new MakeChannelCommand(),
    new MakeMailCommand(),

    new MigrateCommand(),
    new MigrateRollbackCommand(),
    new MigrateResetCommand(),
    new MigrateRefreshCommand(),
    new MigrateFreshCommand(),
    new MigrateStatusCommand(),

    new DbSeedCommand(),
    new DbWipeCommand(),
    new DbMonitorCommand(),
    new DbShowCommand(),
    new DbTableCommand(),

    new KeyGenerateCommand(),
    new AboutCommand(),
];