import { createClient } from "@supabase/supabase-js";
import { DateTime } from "luxon";

export class Database {
  private supabaseUrl = "https://flpcdxxaexyriudizhty.supabase.co";
  private supabaseKey =
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiYW5vbiIsImlhdCI6MTYyNjQyNzkyOCwiZXhwIjoxOTQyMDAzOTI4fQ.XoT5qhcfNYapF_rDJxzokPX9eOGCB0hzBW5crHvcnoA";
  private supabase = createClient(this.supabaseUrl, this.supabaseKey);

  private loc: string;

  constructor(locInput: string) {
    this.loc = locInput;
  }

  getLocation(): string {
    return this.loc;
  }

  subscribe(fn: () => void) {
    // long boi. If location is * subscribe to all, else subscribe to location
    const sensor =
      this.loc === "*"
        ? this.supabase
            .from(`counter`)
            .on("*", (payload) => {
              fn();
            })
            .subscribe()
        : this.supabase
            .from(`counter:location=eq.${this.loc}`)
            .on("*", (payload) => {
              fn();
            })
            .subscribe();
  }

  getSensorList = async (): Promise<Array<Object>> => {
    // If location is * get all, else get from location
    const { data: sensors, error } =
      this.loc === "*"
        ? await this.supabase.from("sensor").select("*")
        : await this.supabase
            .from("sensor")
            .select("*")
            .eq("location", this.loc);

    if (sensors instanceof Array) {
      return sensors;
    }

    return [];
  };

  firstVisitor = async (): Promise<string> => {
    const { data, error } = await this.supabase
      .from("counter")
      .select("*")
      .eq("location", this.loc)
      .eq("direction_in", 1)
      .gt("time", DateTime.now().startOf("day").plus({ hours: 5 }).toMillis())
      .order("time", { ascending: true })
      .limit(1)
      .single();

    if (error) {
      return "No early birds";
    }
    if (
      DateTime.fromMillis(data.time).toFormat("c") !==
      DateTime.now().toFormat("c")
    ) {
      return "No early birds";
    } // Return no birds if not the same day

    return DateTime.fromMillis(data.time).toFormat("HH:mm");
  };

  currentVisitors = async (): Promise<Number> => {
    let time = 0;
    // if it is between 24 and 03
    if (
      parseInt(DateTime.now().toFormat("H")) > 0 &&
      parseInt(DateTime.now().toFormat("H")) < 3
    ) {
      time = DateTime.now()
        .plus({ days: -1 })
        .startOf("day")
        .plus({ hours: 3 })
        .toMillis();
    } else {
      time = DateTime.now().startOf("day").plus({ hours: 3 }).toMillis();
    }

    const { data, error } = await this.supabase
      .from("counter")
      .select("*")
      .eq("location", this.loc)
      .order("time", { ascending: true })
      .gt("time", time);

    if (error) {
      console.log(error);
    }

    let visitors = 0;
    for (const count of data!) {
      visitors = visitors + count.direction_in - count.direction_out;
      if (visitors < 0) {
        visitors = 0;
      }
    }

    return visitors;
  };

  countData = async (start: number, stop: number) => {
    const { data, error, count } = await this.supabase
      .from("counter")
      .select("*", { count: "exact", head: true })
      .eq("location", this.loc)
      .eq("direction_in", 1)
      .gt("time", start)
      .lt("time", stop);

    if (error) {
      console.log(error);
    }
    return count;
  };

  countNightOwls = async (start: number, stop: number) => {
    const { data, error, count } = await this.supabase
      .from("counter")
      .select("*", { count: "exact", head: true })
      .eq("location", this.loc)
      .eq("direction_in", 1)
      .eq("nightowl", true)
      .gt("time", start)
      .lt("time", stop);

    if (error) {
      console.log(error);
    }
    return count;
  };

  getData = async (start: number, stop: number) => {
    const { data, error } = await this.supabase
      .from("counter")
      .select("*")
      .eq("location", this.loc)
      .gt("time", start)
      .lt("time", stop);

    if (error) {
      console.log(error);
    }
    return data;
  };

  getInData = async (start: number, stop: number) => {
    const { data, error } = await this.supabase
      .from("counter")
      .select("*")
      .eq("location", this.loc)
      .eq("direction_in", 1)
      .gt("time", start)
      .lt("time", stop);

    if (error) {
      console.log(error);
    }
    return data;
  };
}
