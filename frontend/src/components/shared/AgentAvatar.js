// AgentAvatar.js - Shared component for consistent agent representation
// Provides a mapping from agent name to avatar/icon for visual personality
import React from "react";
import EmojiObjectsIcon from '@mui/icons-material/EmojiObjects'; // Fundamental
import ShowChartIcon from '@mui/icons-material/ShowChart'; // Technical
import PaidIcon from '@mui/icons-material/Paid'; // Valuation
import SentimentSatisfiedAltIcon from '@mui/icons-material/SentimentSatisfiedAlt'; // Sentiment
import AccountBalanceIcon from '@mui/icons-material/AccountBalance'; // Ben Graham
import RocketLaunchIcon from '@mui/icons-material/RocketLaunch'; // Cathie Wood
import TrendingUpIcon from '@mui/icons-material/TrendingUp'; // Ackman
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents'; // Fisher
import StarIcon from '@mui/icons-material/Star'; // Buffett
import SecurityIcon from '@mui/icons-material/Security'; // Munger
import PublicIcon from '@mui/icons-material/Public'; // Druckenmiller
import WarningAmberIcon from '@mui/icons-material/WarningAmber'; // Risk
import GroupWorkIcon from '@mui/icons-material/GroupWork'; // Portfolio
import SchoolIcon from '@mui/icons-material/School'; // Aswath Damodaran
import RemoveRedEyeIcon from '@mui/icons-material/RemoveRedEye'; // Michael Burry
import SearchIcon from '@mui/icons-material/Search'; // Peter Lynch
import CurrencyRupeeIcon from '@mui/icons-material/CurrencyRupee'; // Rakesh Jhunjhunwala

export const agentAvatarMap = {
  "Fundamental Analysis Agent": <EmojiObjectsIcon color="primary" />,
  "Technical Analyst": <ShowChartIcon color="secondary" />,
  "Valuation Analysis Agent": <PaidIcon color="success" />,
  "Sentiment Analysis Agent": <SentimentSatisfiedAltIcon color="warning" />,
  "Ben Graham Agent": <AccountBalanceIcon color="info" />,
  "Cathie Wood Agent": <RocketLaunchIcon color="secondary" />,
  "Bill Ackman Agent": <TrendingUpIcon color="success" />,
  "Phil Fisher Agent": <EmojiEventsIcon color="warning" />,
  "Warren Buffett Agent": <StarIcon color="primary" />,
  "Charlie Munger Agent": <SecurityIcon color="info" />,
  "Stanley Druckenmiller Agent": <PublicIcon color="secondary" />,
  "Risk Management Agent": <WarningAmberIcon color="error" />,
  "Portfolio Management Agent": <GroupWorkIcon color="primary" />,
  "Aswath Damodaran": <SchoolIcon color="info" />,
  "Michael Burry": <RemoveRedEyeIcon color="warning" />,
  "Peter Lynch": <SearchIcon color="success" />,
  "Rakesh Jhunjhunwala": <CurrencyRupeeIcon color="secondary" />
};

export default function AgentAvatar({ agent }) {
  return agentAvatarMap[agent] || <EmojiObjectsIcon color="disabled" />;
}
