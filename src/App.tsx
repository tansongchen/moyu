import { useEffect, useState } from "react";
import {
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from "recharts";
import ButtonGroup from "react-bootstrap/ButtonGroup";
import Button from "react-bootstrap/Button";
import { ListGroup } from "react-bootstrap";

function getWeekNumber(d: Date) {
  // Copy date so don't modify original
  d = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  // Set to nearest Thursday: current date + 4 - current day number
  // Make Sunday's day number 7
  d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
  // Get first day of year
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  // Calculate full weeks to nearest Thursday
  const weekNo = Math.ceil(
    ((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7
  );
  // Return array of year and week number
  return weekNo;
}

function computeTypeAverage(data: Map<string, number>, dates: string[]) {
  let sum = 0;
  let count = 0;
  dates.forEach((date) => {
    const time = data.get(date);
    if (time !== undefined) {
      sum += time;
      count += 1;
    }
  });
  return count === 0 ? undefined : sum / count;
}

// 计算周均、月均、季均、年均
function computeAverages(data: Map<string, number>, now: Date) {
  const sameWeek: string[] = [];
  const sameMonth: string[] = [];
  const sameQuarter: string[] = [];
  const sameYear: string[] = [];
  for (let i = 0; i < 366; i++) {
    const datetime = new Date(now.getTime() - 1000 * 60 * 60 * 24 * i);
    const week = getWeekNumber(datetime);
    const month = datetime.getMonth() + 1;
    const quarter = Math.floor((month - 1) / 3) + 1;
    const year = datetime.getFullYear();
    if (year === now.getFullYear()) {
      sameYear.push(datetime.toLocaleDateString());
      if (week === getWeekNumber(now)) {
        sameWeek.push(datetime.toLocaleDateString());
      }
      if (quarter === Math.floor((now.getMonth() + 1) / 3) + 1) {
        sameQuarter.push(datetime.toLocaleDateString());
        if (month === now.getMonth() + 1) {
          sameMonth.push(datetime.toLocaleDateString());
        }
      }
    }
  }
  return {
    week: computeTypeAverage(data, sameWeek),
    month: computeTypeAverage(data, sameMonth),
    quarter: computeTypeAverage(data, sameQuarter),
    year: computeTypeAverage(data, sameYear),
  };
}

const rating = (value?: number) => {
  if (value === undefined) {
    return "未知";
  } else if (value < 8 * 60) {
    return "内卷";
  } else if (value < 9 * 60) {
    return "正常";
  } else if (value < 10 * 60) {
    return "摸鱼";
  } else if (value < 11 * 60) {
    return "躺平";
  } else {
    return "摆烂";
  }
};

const timeFormatter = (value?: number) => {
  if (value === undefined) {
    return "未知";
  }
  const hours = Math.floor(value / 60);
  const minutes = value % 60;
  return `${hours}:${minutes.toString().padStart(2, "0")}`;
};

const Card = ({ type, average }: { type: string; average?: number }) => {
  return (
    <ListGroup.Item className="time-card">
      <span>
        <strong>{type}</strong>
      </span>
      <span>{rating(average)}</span>
      <span>{timeFormatter(average)}</span>
    </ListGroup.Item>
  );
};

const Plot: React.FC = () => {
  const [data, setData] = useState(new Map<string, number>());
  const [past, setPast] = useState(10);

  useEffect(() => {
    fetch("/api")
      .then((res) => res.json() as Promise<string[]>)
      .then((raw) => {
        const data = new Map<string, number>();
        raw.forEach((d) => {
          const datetime = new Date(d);
          const date = datetime.toLocaleDateString();
          const time = datetime.getHours() * 60 + datetime.getMinutes();
          data.set(date, time);
        });
        setData(data);
      });
  }, []);

  const now = new Date();

  const days = [...Array(past).keys()]
    .map((i) => {
      const datetime = new Date(now.getTime() - 1000 * 60 * 60 * 24 * i);
      const hash = datetime.toLocaleDateString();
      const display = `${datetime.getMonth() + 1}/${datetime.getDate()}`;
      return { date: display, time: data.get(hash) };
    })
    .reverse();

  const { week, month, quarter, year } = computeAverages(data, now);

  return (
    <>
      <ListGroup horizontal={true}>
        <Card type="今日" average={data.get(now.toLocaleDateString())} />
        <Card type="周均" average={week} />
        <Card type="月均" average={month} />
        <Card type="季均" average={quarter} />
        <Card type="年均" average={year} />
      </ListGroup>
      <ButtonGroup>
        <Button variant="secondary" onClick={() => setPast(10)}>
          近 10 天
        </Button>
        <Button variant="secondary" onClick={() => setPast(30)}>
          近 30 天
        </Button>
        <Button variant="secondary" onClick={() => setPast(100)}>
          近 100 天
        </Button>
      </ButtonGroup>
      <ResponsiveContainer width="96%" height={400}>
        <BarChart
          width={380}
          height={350}
          data={days}
          margin={{
            top: 5,
            right: 20,
            bottom: 5,
            left: 0,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" allowDataOverflow />
          <YAxis tickFormatter={timeFormatter} domain={[8 * 60, 12 * 60]} />
          <Tooltip formatter={(value: number) => timeFormatter(value)} />
          <Bar dataKey="time" fill="#82ca9d" />
        </BarChart>
      </ResponsiveContainer>
    </>
  );
};

function App() {
  return (
    <>
      <h1>谭淞宸今天摸鱼了吗？</h1>
      <Plot />
    </>
  );
}

export default App;
