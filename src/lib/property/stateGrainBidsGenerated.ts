/**
 * stateGrainBidsGenerated — GENERATED FILE. Do not edit by hand.
 *
 * Local grain-buyer cash bids by state from USDA AMS Market News (public
 * record). Average local bid, range, and day-over-day direction, $/bushel.
 * Re-run: MARS_API_KEY=<key> npm run ingest:ams-grain-bids
 */

export const STATE_GRAIN_BIDS_PROVENANCE = {
  asOf: "2026-07-17" as string | null,
  source: "USDA AMS Market News (marsapi.ams.usda.gov)",
  resolvedStates: 14,
} as const;

export interface GrainBid {
  /** Average local cash bid, $/bushel. */
  avg: number;
  min: number | null;
  max: number | null;
  /** Day-over-day direction: "UP" | "DOWN" | "UNCH" | null. */
  direction: string | null;
}

export interface StateGrainBids {
  /** Report date, YYYY-MM-DD. */
  reportDate: string;
  bids: Record<string, GrainBid>;
}

export const STATE_GRAIN_BIDS: Record<string, StateGrainBids> = {
  "MD": {
    "reportDate": "06/23/2026",
    "bids": {
      "soybeans": {
        "avg": 10.78,
        "min": 10.52,
        "max": 11.02,
        "direction": "DN"
      },
      "wheat": {
        "avg": 5.27,
        "min": 5.02,
        "max": 5.72,
        "direction": "DN"
      },
      "corn": {
        "avg": 4.54,
        "min": 4.2,
        "max": 5,
        "direction": "DN"
      }
    }
  },
  "PA": {
    "reportDate": "07/14/2026",
    "bids": {
      "soybeans": {
        "avg": 13.71,
        "min": 11.26,
        "max": 23.5,
        "direction": "DN"
      },
      "wheat": {
        "avg": 8.02,
        "min": 5.6,
        "max": 13,
        "direction": "UP"
      },
      "corn": {
        "avg": 5.92,
        "min": 4.04,
        "max": 13.3,
        "direction": "DN"
      }
    }
  },
  "OH": {
    "reportDate": "07/16/2026",
    "bids": {
      "soybeans": {
        "avg": 11.83,
        "min": 11.2,
        "max": 12.35,
        "direction": "DN"
      },
      "corn": {
        "avg": 4.38,
        "min": 3.99,
        "max": 4.58,
        "direction": "DN"
      },
      "wheat": {
        "avg": 6.45,
        "min": 5.8,
        "max": 6.7,
        "direction": "DN"
      }
    }
  },
  "KY": {
    "reportDate": "07/16/2026",
    "bids": {
      "soybeans": {
        "avg": 11.73,
        "min": 11.03,
        "max": 12.35,
        "direction": "DN"
      },
      "wheat": {
        "avg": 6.39,
        "min": 6,
        "max": 6.65,
        "direction": "DN"
      },
      "corn": {
        "avg": 4.72,
        "min": 4.13,
        "max": 5.82,
        "direction": "DN"
      }
    }
  },
  "TN": {
    "reportDate": "07/17/2026",
    "bids": {
      "soybeans": {
        "avg": 12.01,
        "min": 11.53,
        "max": 12.46,
        "direction": "UP"
      },
      "corn": {
        "avg": 4.74,
        "min": 4.28,
        "max": 5.05,
        "direction": "UP"
      },
      "wheat": {
        "avg": 6.48,
        "min": 6.18,
        "max": 6.73,
        "direction": "UP"
      }
    }
  },
  "IA": {
    "reportDate": "07/16/2026",
    "bids": {
      "soybeans": {
        "avg": 11.62,
        "min": 10.96,
        "max": 12.15,
        "direction": "DN"
      },
      "corn": {
        "avg": 4.12,
        "min": 3.81,
        "max": 4.33,
        "direction": "DN"
      }
    }
  },
  "KS": {
    "reportDate": "07/17/2026",
    "bids": {
      "soybeans": {
        "avg": 11.62,
        "min": 10.59,
        "max": 12.74,
        "direction": "UP"
      },
      "wheat": {
        "avg": 6.77,
        "min": 6.37,
        "max": 7.07,
        "direction": "UP"
      },
      "corn": {
        "avg": 4.17,
        "min": 3.95,
        "max": 4.5,
        "direction": "UP"
      }
    }
  },
  "MO": {
    "reportDate": "07/17/2026",
    "bids": {
      "soybeans": {
        "avg": 12.1,
        "min": 11.54,
        "max": 12.7,
        "direction": "UP"
      },
      "wheat": {
        "avg": 6.46,
        "min": 5.78,
        "max": 7.23,
        "direction": "UP"
      },
      "corn": {
        "avg": 4.35,
        "min": 3.86,
        "max": 4.83,
        "direction": "UP"
      }
    }
  },
  "AR": {
    "reportDate": "07/17/2026",
    "bids": {
      "soybeans": {
        "avg": 11.92,
        "min": 11.58,
        "max": 12.23,
        "direction": "UP"
      },
      "corn": {
        "avg": 4.74,
        "min": 4.52,
        "max": 4.97,
        "direction": "UP"
      },
      "wheat": {
        "avg": 6.83,
        "min": 6.83,
        "max": 6.83,
        "direction": "UP"
      }
    }
  },
  "MS": {
    "reportDate": "07/16/2026",
    "bids": {
      "soybeans": {
        "avg": 11.92,
        "min": 11.79,
        "max": 12.19,
        "direction": "DN"
      },
      "corn": {
        "avg": 4.52,
        "min": 4.43,
        "max": 4.63,
        "direction": "DN"
      },
      "wheat": {
        "avg": 6.27,
        "min": 6.09,
        "max": 6.44,
        "direction": "UP"
      }
    }
  },
  "SC": {
    "reportDate": "07/17/2026",
    "bids": {
      "soybeans": {
        "avg": 12.07,
        "min": 11.73,
        "max": 12.32,
        "direction": "UP"
      },
      "corn": {
        "avg": 5.1,
        "min": 4.55,
        "max": 5.63,
        "direction": "UP"
      },
      "wheat": {
        "avg": 6.85,
        "min": 5.2,
        "max": 8.33,
        "direction": "UP"
      }
    }
  },
  "OK": {
    "reportDate": "07/16/2026",
    "bids": {
      "soybeans": {
        "avg": 11.11,
        "min": 10.7,
        "max": 11.25,
        "direction": "DN"
      },
      "wheat": {
        "avg": 6.65,
        "min": 6.26,
        "max": 8.27,
        "direction": "DN"
      },
      "corn": {
        "avg": 4.28,
        "min": 4.01,
        "max": 4.67,
        "direction": "DN"
      }
    }
  },
  "TX": {
    "reportDate": "07/17/2026",
    "bids": {
      "corn": {
        "avg": 5.04,
        "min": 4.5,
        "max": 5.85,
        "direction": "UP"
      },
      "wheat": {
        "avg": 6.6,
        "min": 6.32,
        "max": 7.07,
        "direction": "UP"
      }
    }
  },
  "CO": {
    "reportDate": "07/16/2026",
    "bids": {
      "soybeans": {
        "avg": 10.73,
        "min": 10.6,
        "max": 11,
        "direction": "DN"
      },
      "wheat": {
        "avg": 6.65,
        "min": 6.42,
        "max": 7.26,
        "direction": "DN"
      },
      "corn": {
        "avg": 4.51,
        "min": 4.04,
        "max": 5.19,
        "direction": "DN"
      }
    }
  }
};
