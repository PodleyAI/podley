import { createServiceToken } from "@ellmers/util";

export const SEC_RAW_DATA_FOLDER = createServiceToken<string>("sec.raw.data.folder");
export const SEC_DB_FOLDER = createServiceToken<string>("sec.db.folder");
export const SEC_DB_NAME = createServiceToken<string>("sec.db.name");
