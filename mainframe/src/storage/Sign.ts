import pg from "pg";
import * as entity from "../entity";
import Context from "./Context";
import Stash from "./Stash";
type Filter = (
  | ["&" | "|", Filter[]]
  | ["=", "id", entity.Sign["id"]]
  | ["=", "kind", entity.Sign["kind"]]
  | ["=", "data", entity.Sign["data"]]
  | ["=", "owner", entity.Sign["owner"]["id"]]
  | ["in", "id", Array<entity.Sign["id"]>]
);
namespace Filter {
  export function build(st: Filter): string {
    switch (st[0]) {
      case "|": case "&": return st[1].map(e => `(${Filter.build(e)})`).join({ "|": " OR ", "&": " AND " }[st[0]]);
      case "=": switch (st[1]) {
        case "id": return `id=${pg.Client.prototype.escapeLiteral(st[2])}`;
        case "kind": return `kind=${pg.Client.prototype.escapeLiteral(st[2])}`;
        case "data": return `data=${pg.Client.prototype.escapeLiteral(st[2])}`;
        case "owner": return `owner=${pg.Client.prototype.escapeLiteral(st[2])}`
      }
      case "in": switch (st[1]) {
        case "id": return `id IN(${st[2].map(pg.Client.prototype.escapeLiteral).join(",")})`;
      }
    }
  }
}
export class Sign {
  public readonly stash = new Stash<string, entity.Sign>();
  constructor(private readonly context: Context) { }

  private async make(rows: any[]): Promise<entity.Sign[]> {
    const owners = await this.context.account.get(rows.map(row => row.owner));
    return rows.map((row) => this.stash.get(row.id, () => new entity.Sign({
      id: String(row.id),
      created: new Date(row.created),
      kind: row.kind,
      data: String(row.data),
      owner: owners.get(row.owner)!,
    })));
  }
  public async get(ids: entity.Sign["id"]): Promise<entity.Sign | null>;
  public async get(ids: Array<entity.Sign["id"]>): Promise<Map<entity.Sign["id"], entity.Sign>>;
  public async get(id: Array<entity.Sign["id"]> | entity.Sign["id"]) {
    if (!Array.isArray(id))
      return this.stash.get(id) ?? await this.read(["=", "id", id]).one();
    const notStashed = id.filter(v => !this.stash.has(v));
    if (notStashed.length)
      await this.read(["in", "id", notStashed]);
    return new Map(id.filter(this.stash.has).map(v => [v, this.stash.get(v)!]));

  }
  public read(filter?: Filter) {
    return new class Reader extends Promise<entity.Sign[]> {
      private _filter?: Filter = filter;
      private _limit: number | undefined;
      private _skip: number | undefined;
      constructor(private readonly repository: Sign) {
        super((ok, fail) => this.all().then(ok, fail));
      }
      public kind(n: entity.Sign["kind"]) {
        return this.filter(["=", "kind", n]);
      }
      public owner(n: entity.Account) {
        return this.filter(["=", "owner", n.id]);
      }
      public data(n: entity.Sign["data"]) {
        return this.filter(["=", "data", n]);
      }
      public id(n: entity.Sign["id"] | Array<entity.Sign["id"]>) {
        if (Array.isArray(n)) return this.filter(["in", "id", n]);
        return this.filter(["=", "id", n]);
      }
      public limit(n?: number): Reader {
        const reader = this.clone();
        reader._limit = n;
        return reader;
      }
      public skip(n?: number): Reader {
        const reader = this.clone();
        reader._skip = n;
        return reader;
      }
      public filter(n?: Filter): Reader {
        const reader = this.clone();
        reader._filter = n && this._filter ? ["&", [this._filter, n]] : n;
        return reader;
      }
      private clone() {
        const reader = new Reader(this.repository);
        reader._filter = this._filter;
        reader._skip = this._skip;
        reader._limit = this._limit;
        return reader;
      }
      private static build(e: Reader) {
        let query = "SELECT id, kind, data, created, owner FROM account.sign";
        if (filter) query += " WHERE " + Filter.build(filter);
        if (e._limit) query += " LIMIT " + Number(e._limit);
        if (e._skip) query += " OFFSET " + Number(e._skip);
        return query;
      }
      public async one(): Promise<entity.Sign | null> {
        const accounts = await this.limit(1).all();
        return accounts[0] ?? null;
      }
      public async all(): Promise<entity.Sign[]> {
        const sql = Reader.build(this);
        return this.repository.context.connect(async () => {
          const response = await this.repository.context.query(sql);
          return this.repository.make(response.rows);
        })
      }
    }(this)
  }

  public async save(signs: entity.Sign | entity.Sign[]): Promise<void> {
    if (!Array.isArray(signs)) {
      signs = [signs];
    }
    if (signs.length === 0) return;
    const sql = `
      INSERT INTO account.sign(id, kind, data, created, owner) 
      VALUES 
      (${
      signs.map(v => [
        pg.Client.prototype.escapeLiteral(v.id),
        pg.Client.prototype.escapeLiteral(v.kind),
        pg.Client.prototype.escapeLiteral(v.data),
        pg.Client.prototype.escapeLiteral(v.created.toISOString()),
        pg.Client.prototype.escapeLiteral(v.owner.id),
      ]).join("),(")
      }) 
      ON CONFLICT(id) 
        DO UPDATE 
          SET data=EXCLUDED.data 
          WHERE (account.data)!=(EXCLUDED.data)
    `
    this.context.query(sql)
  }
}
export default Sign;