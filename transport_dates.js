let Transport = {}

const tdates =
{
   "GOJ": [
      {
         "year": 1985,
         "mindate": "1985-03-30",
         "maxdate": "1985-07-23"
      },
      {
         "year": 1986,
         "mindate": "1986-04-05",
         "maxdate": "1986-07-03"
      },
      {
         "year": 1987,
         "mindate": "1987-04-05",
         "maxdate": "1987-07-09"
      },
      {
         "year": 1988,
         "mindate": "1988-04-12",
         "maxdate": "1988-07-15"
      },
      {
         "year": 1989,
         "mindate": "1989-04-08",
         "maxdate": "1989-07-11"
      },
      {
         "year": 1990,
         "mindate": "1990-04-16",
         "maxdate": "1990-07-21"
      },
      {
         "year": 1991,
         "mindate": "1991-04-05",
         "maxdate": "1991-08-31"
      },
      {
         "year": 1992,
         "mindate": "1992-04-14",
         "maxdate": "1992-10-31"
      },
      {
         "year": 1993,
         "mindate": "1993-04-18",
         "maxdate": "1993-11-01"
      },
      {
         "year": 1994,
         "mindate": "1994-04-07",
         "maxdate": "1994-11-01"
      },
      {
         "year": 1995,
         "mindate": "1995-04-03",
         "maxdate": "1995-11-01"
      },
      {
         "year": 1996,
         "mindate": "1996-04-03",
         "maxdate": "1996-10-28"
      },
      {
         "year": 1997,
         "mindate": "1997-04-03",
         "maxdate": "1997-11-01"
      },
      {
         "year": 1998,
         "mindate": "1998-04-03",
         "maxdate": "1998-11-01"
      },
      {
         "year": 1999,
         "mindate": "1999-04-02",
         "maxdate": "1999-11-04"
      },
      {
         "year": 2000,
         "mindate": "2000-04-02",
         "maxdate": "2000-10-31"
      },
      {
         "year": 2001,
         "mindate": "2001-04-02",
         "maxdate": "2001-10-31"
      },
      {
         "year": 2002,
         "mindate": "2002-04-02",
         "maxdate": "2002-10-31"
      },
      {
         "year": 2003,
         "mindate": "2003-04-02",
         "maxdate": "2003-10-31"
      },
      {
         "year": 2004,
         "mindate": "2004-04-02",
         "maxdate": "2004-10-31"
      },
      {
         "year": 2005,
         "mindate": "2005-04-02",
         "maxdate": "2005-10-31"
      },
      {
         "year": 2006,
         "mindate": "2006-04-25",
         "maxdate": "2006-11-01"
      },
      {
         "year": 2007,
         "mindate": "2007-05-09",
         "maxdate": "2007-10-31"
      },
      {
         "year": 2008,
         "mindate": "2008-05-10",
         "maxdate": "2008-11-01"
      },
      {
         "year": 2009,
         "mindate": "2009-05-06",
         "maxdate": "2009-10-31"
      },
      {
         "year": 2010,
         "mindate": "2010-05-02",
         "maxdate": "2010-10-31"
      },
      {
         "year": 2011,
         "mindate": "2011-05-06",
         "maxdate": "2011-10-31"
      },
      {
         "year": 2012,
         "mindate": "2012-05-04",
         "maxdate": "2012-10-31"
      },
      {
         "year": 2013,
         "mindate": "2013-05-03",
         "maxdate": "2013-10-31"
      },
      {
         "year": 2014,
         "mindate": "2014-05-02",
         "maxdate": "2014-10-31"
      },
      {
         "year": 2015,
         "mindate": "2015-05-02",
         "maxdate": "2015-09-29"
      },
      {
         "year": 2016,
         "mindate": "2016-05-02",
         "maxdate": "2016-11-01"
      },
      {
         "year": 2017,
         "mindate": "2017-05-02",
         "maxdate": "2017-11-02"
      },
      {
         "year": 2018,
         "mindate": "2018-04-24",
         "maxdate": "2018-11-02"
      },
      {
         "year": 2019,
         "mindate": "2019-04-24",
         "maxdate": "2019-11-01"
      },
      {
         "year": 2020,
         "mindate": "2020-04-24",
         "maxdate": "2020-11-01"
      },
      {
         "year": 2021,
         "mindate": "2021-04-24",
         "maxdate": "2021-11-01"
      },
      {
         "year": 2022,
         "mindate": "2022-04-24",
         "maxdate": "2022-11-01"
      }
   ],
   "LMJ": [
      {
         "year": 1993,
         "mindate": "1993-05-04",
         "maxdate": "1993-11-01"
      },
      {
         "year": 1994,
         "mindate": "1994-04-07",
         "maxdate": "1994-11-01"
      },
      {
         "year": 1995,
         "mindate": "1995-04-03",
         "maxdate": "1995-11-01"
      },
      {
         "year": 1996,
         "mindate": "1996-04-03",
         "maxdate": "1996-10-28"
      },
      {
         "year": 1997,
         "mindate": "1997-04-03",
         "maxdate": "1997-11-01"
      },
      {
         "year": 1998,
         "mindate": "1998-04-03",
         "maxdate": "1998-10-30"
      },
      {
         "year": 1999,
         "mindate": "1999-04-02",
         "maxdate": "1999-10-31"
      },
      {
         "year": 2000,
         "mindate": "2000-04-02",
         "maxdate": "2000-10-31"
      },
      {
         "year": 2001,
         "mindate": "2001-04-02",
         "maxdate": "2001-10-31"
      },
      {
         "year": 2002,
         "mindate": "2002-04-04",
         "maxdate": "2002-10-29"
      },
      {
         "year": 2003,
         "mindate": "2003-04-02",
         "maxdate": "2003-10-01"
      },
      {
         "year": 2004,
         "mindate": "2004-04-02",
         "maxdate": "2004-10-01"
      },
      {
         "year": 2005,
         "mindate": "2005-04-03",
         "maxdate": "2005-10-01"
      },
      {
         "year": 2006,
         "mindate": "2006-04-28",
         "maxdate": "2006-09-30"
      },
      {
         "year": 2007,
         "mindate": "2007-05-12",
         "maxdate": "2007-10-01"
      },
      {
         "year": 2008,
         "mindate": "2008-05-13",
         "maxdate": "2008-09-30"
      },
      {
         "year": 2009,
         "mindate": "2009-05-09",
         "maxdate": "2009-10-01"
      },
      {
         "year": 2010,
         "mindate": "2010-05-05",
         "maxdate": "2010-10-01"
      },
      {
         "year": 2011,
         "mindate": "2011-05-09",
         "maxdate": "2011-10-01"
      },
      {
         "year": 2012,
         "mindate": "2012-05-06",
         "maxdate": "2012-10-01"
      },
      {
         "year": 2013,
         "mindate": "2013-05-08",
         "maxdate": "2013-10-01"
      },
      {
         "year": 2014,
         "mindate": "2014-05-02",
         "maxdate": "2014-10-01"
      },
      {
         "year": 2015,
         "mindate": "2015-05-02",
         "maxdate": "2015-09-29"
      },
      {
         "year": 2016,
         "mindate": "2016-05-02",
         "maxdate": "2016-09-30"
      },
      {
         "year": 2017,
         "mindate": "2017-05-02",
         "maxdate": "2017-10-01"
      },
      {
         "year": 2018,
         "mindate": "2018-04-24",
         "maxdate": "2018-08-18"
      },
      {
         "year": 2019,
         "mindate": "2019-04-24",
         "maxdate": "2019-08-03"
      },
      {
         "year": 2020,
         "mindate": "2020-04-24",
         "maxdate": "2020-06-21"
      },
      {
         "year": 2021,
         "mindate": "2021-04-24",
         "maxdate": "2021-06-20"
      }
   ],
   "GRJ": [
      {
         "year": 1985,
         "mindate": "1985-03-28",
         "maxdate": "1985-07-23"
      },
      {
         "year": 1986,
         "mindate": "1986-03-27",
         "maxdate": "1986-07-24"
      },
      {
         "year": 1987,
         "mindate": "1987-03-29",
         "maxdate": "1987-07-31"
      },
      {
         "year": 1988,
         "mindate": "1988-03-28",
         "maxdate": "1988-07-24"
      },
      {
         "year": 1989,
         "mindate": "1989-03-29",
         "maxdate": "1989-07-27"
      },
      {
         "year": 1990,
         "mindate": "1990-03-30",
         "maxdate": "1990-07-26"
      },
      {
         "year": 1991,
         "mindate": "1991-03-30",
         "maxdate": "1991-10-31"
      },
      {
         "year": 1992,
         "mindate": "1992-04-03",
         "maxdate": "1992-10-31"
      },
      {
         "year": 1993,
         "mindate": "1993-04-15",
         "maxdate": "1993-11-01"
      },
      {
         "year": 1994,
         "mindate": "1994-04-07",
         "maxdate": "1994-11-01"
      },
      {
         "year": 1995,
         "mindate": "1995-03-30",
         "maxdate": "1995-11-01"
      },
      {
         "year": 1996,
         "mindate": "1996-03-29",
         "maxdate": "1996-10-31"
      },
      {
         "year": 1997,
         "mindate": "1997-03-28",
         "maxdate": "1997-11-01"
      },
      {
         "year": 1998,
         "mindate": "1998-03-28",
         "maxdate": "1998-11-01"
      },
      {
         "year": 1999,
         "mindate": "1999-03-27",
         "maxdate": "1999-11-10"
      },
      {
         "year": 2000,
         "mindate": "2000-03-27",
         "maxdate": "2000-10-31"
      },
      {
         "year": 2001,
         "mindate": "2001-03-27",
         "maxdate": "2001-10-31"
      },
      {
         "year": 2002,
         "mindate": "2002-03-27",
         "maxdate": "2002-10-31"
      },
      {
         "year": 2003,
         "mindate": "2003-03-27",
         "maxdate": "2003-10-31"
      },
      {
         "year": 2004,
         "mindate": "2004-03-27",
         "maxdate": "2004-10-31"
      },
      {
         "year": 2005,
         "mindate": "2005-03-27",
         "maxdate": "2005-10-31"
      },
      {
         "year": 2006,
         "mindate": "2006-04-21",
         "maxdate": "2006-10-30"
      },
      {
         "year": 2007,
         "mindate": "2007-04-12",
         "maxdate": "2007-10-31"
      },
      {
         "year": 2008,
         "mindate": "2008-04-10",
         "maxdate": "2008-11-01"
      },
      {
         "year": 2009,
         "mindate": "2009-04-09",
         "maxdate": "2009-10-31"
      },
      {
         "year": 2010,
         "mindate": "2010-04-22",
         "maxdate": "2010-10-31"
      },
      {
         "year": 2011,
         "mindate": "2011-04-07",
         "maxdate": "2011-11-01"
      },
      {
         "year": 2012,
         "mindate": "2012-04-12",
         "maxdate": "2012-10-31"
      },
      {
         "year": 2013,
         "mindate": "2013-04-26",
         "maxdate": "2013-10-31"
      },
      {
         "year": 2014,
         "mindate": "2014-04-25",
         "maxdate": "2014-10-31"
      },
      {
         "year": 2015,
         "mindate": "2015-04-16",
         "maxdate": "2015-09-29"
      },
      {
         "year": 2016,
         "mindate": "2016-05-02",
         "maxdate": "2016-10-31"
      },
      {
         "year": 2017,
         "mindate": "2017-04-13",
         "maxdate": "2017-08-02"
      },
      {
         "year": 2018,
         "mindate": "2018-04-12",
         "maxdate": "2018-10-31"
      },
      {
         "year": 2019,
         "mindate": "2019-04-04",
         "maxdate": "2019-11-01"
      },
      {
         "year": 2020,
         "mindate": "2020-04-24",
         "maxdate": "2020-11-01"
      },
      {
         "year": 2021,
         "mindate": "2021-04-15",
         "maxdate": "2021-11-01"
      },
      {
         "year": 2022,
         "mindate": "2022-04-14",
         "maxdate": "2022-11-01"
      }
   ],
   "MCJ": [
      {
         "year": 1985,
         "mindate": "1985-04-06",
         "maxdate": "1985-09-26"
      },
      {
         "year": 1986,
         "mindate": "1986-03-27",
         "maxdate": "1986-09-26"
      },
      {
         "year": 1987,
         "mindate": "1987-03-28",
         "maxdate": "1987-10-29"
      },
      {
         "year": 1988,
         "mindate": "1988-03-28",
         "maxdate": "1988-09-21"
      },
      {
         "year": 1989,
         "mindate": "1989-03-27",
         "maxdate": "1989-09-19"
      },
      {
         "year": 1990,
         "mindate": "1990-04-03",
         "maxdate": "1990-09-14"
      },
      {
         "year": 1991,
         "mindate": "1991-03-28",
         "maxdate": "1991-09-30"
      },
      {
         "year": 1992,
         "mindate": "1992-03-27",
         "maxdate": "1992-12-05"
      },
      {
         "year": 1993,
         "mindate": "1993-04-15",
         "maxdate": "1993-11-03"
      },
      {
         "year": 1994,
         "mindate": "1994-04-11",
         "maxdate": "1994-11-22"
      },
      {
         "year": 1995,
         "mindate": "1995-06-22",
         "maxdate": "1995-12-08"
      },
      {
         "year": 1996,
         "mindate": "1996-06-06",
         "maxdate": "1996-11-22"
      },
      {
         "year": 1997,
         "mindate": "1997-05-30",
         "maxdate": "1997-12-14"
      },
      {
         "year": 1998,
         "mindate": "1998-06-02",
         "maxdate": "1998-12-15"
      },
      {
         "year": 1999,
         "mindate": "1999-06-24",
         "maxdate": "1999-12-14"
      },
      {
         "year": 2000,
         "mindate": "2000-06-22",
         "maxdate": "2000-11-28"
      },
      {
         "year": 2001,
         "mindate": "2001-05-01",
         "maxdate": "2001-12-09"
      },
      {
         "year": 2002,
         "mindate": "2002-05-04",
         "maxdate": "2002-12-11"
      },
      {
         "year": 2003,
         "mindate": "2003-06-28",
         "maxdate": "2003-10-01"
      },
      {
         "year": 2004,
         "mindate": "2004-06-24",
         "maxdate": "2004-09-19"
      },
      {
         "year": 2005,
         "mindate": "2005-06-24",
         "maxdate": "2005-09-15"
      },
      {
         "year": 2006,
         "mindate": "2006-07-07",
         "maxdate": "2006-09-14"
      },
      {
         "year": 2007,
         "mindate": "2007-08-18",
         "maxdate": "2007-09-13"
      },
      {
         "year": 2008,
         "mindate": "2008-07-17",
         "maxdate": "2008-09-22"
      },
      {
         "year": 2009,
         "mindate": "2009-07-16",
         "maxdate": "2009-10-01"
      },
      {
         "year": 2010,
         "mindate": "2010-07-16",
         "maxdate": "2010-10-01"
      },
      {
         "year": 2011,
         "mindate": "2011-07-21",
         "maxdate": "2011-09-30"
      },
      {
         "year": 2012,
         "mindate": "2012-08-18",
         "maxdate": "2012-10-01"
      }
   ]
}

let tdateFormat = d3.time.format("%Y-%m-%d");
Transport.tdates = {}
Object.keys(tdates).forEach(function(loc){
	Transport.tdates[loc] = {}
	tdates[loc].forEach(function(d){
		Transport.tdates[loc][d.year] = {mindate: tdateFormat.parse(d.mindate), maxdate: tdateFormat.parse(d.maxdate)}
	})
})



