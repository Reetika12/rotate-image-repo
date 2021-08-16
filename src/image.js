import React, { useState, useEffect } from "react"
import ArrowBackIcon from "@material-ui/icons/ArrowBack"
import styled from "styled-components"
import { Spinner, Breadcrumb } from "react-bootstrap"
import Snackbar from "@material-ui/core/Snackbar"
import Alert from "@material-ui/lab/Alert"
import ShowPDF from "./ShowPdf"
import RotateLeftIcon from '@material-ui/icons/RotateLeft';
import { isFileFormatZip, loadFileAsBlob } from "../../../utils/FileUtils"

const isBrowser = () => typeof window !== "undefined"
const JSZip = require("jszip")

function DashboardOps() {
  const [user, setuser] = useState({})
  const [userkycdetails, setuserkycdetails] = useState({})
  const [userKycStatus, setuserKycStatus] = useState({})
  const [ispanLoading, setIspanLoading] = useState(false)
  const [isbankLoading, setIsbankLoading] = useState(false)
  const [isdematLoading, setIsdematLoading] = useState(false)
  const [isDematZip, setIsDematZip] = useState(false)
  const [isPanZip, setIsPanZip] = useState(false)
  const [dematPDFFile, setDematPDFFile] = useState(null)
  const [panPDFFile, setPanPDFFile] = useState(null)
  const [showPDFModal, setShowPDFModal] = useState(false)
  const [showPDFFile, setShowPDFFile] = useState()
  var angle = 0
  var dematangle=0;
  const [state, setState] = useState({
    open: false,
    vertical: "top",
    horizontal: "center",
    message: "",
    severity: "",
  })
  const { vertical, horizontal, open } = state

  const CommonApi = () => {
    let pathname = window.location.pathname.split("/")
    let userid = pathname[pathname.length - 1]
    console.log("pathname", userid)
    let agentAuthToken = localStorage.getItem("AGENT_AUTH_TOKEN")
    fetch(
      `https://y94x1uz8w8.execute-api.us-east-1.amazonaws.com/api/admin/getIndividualUserKYCDetails?userId=${userid}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "X-AUTH-TOKEN": agentAuthToken,
        },
      }
    )
      .then(res => res.json())
      .then(data => {
        setuser(data.user)
        setuserkycdetails(data.userKYCDetails)
        const panFileName = data.userKYCDetails.panAwsFilename
          ? data.userKYCDetails.panAwsFilename
          : ""
        const dematFileName = data.userKYCDetails.dematAwsFilename
          ? data.userKYCDetails.dematAwsFilename
          : ""
        setIsPanZip(isFileFormatZip(panFileName))
        setIsDematZip(isFileFormatZip(dematFileName))
        setuserKycStatus(data.userKycStatus)
      })
      .catch(error => {
        console.log("error++++", error.message)
      })
  }

  useEffect(() => {
    if (isPanZip) {
      loadFileAsBlob(userkycdetails.panAwsFilename).then(blob => {
        JSZip.loadAsync(blob).then(zip => {
          zip.forEach((relativePath, file) => {
            file.async("blob").then(blob => {
              blob.lastModifiedDate = file.date
              blob.name = file.name
              setPanPDFFile(blob)
            })
          })
        })
      })
    }
    if (isDematZip) {
      loadFileAsBlob(userkycdetails.dematAwsFilename).then(blob => {
        JSZip.loadAsync(blob).then(zip => {
          zip.forEach((relativePath, file) => {
            file.async("blob").then(blob => {
              blob.lastModifiedDate = file.date
              blob.name = file.name
              setDematPDFFile(blob)
            })
          })
        })
      })
    }
  }, [isPanZip, isDematZip])

  useEffect(() => {
    CommonApi()
  }, [])

  const changeStatusEvent = (status, categoryid, lastupdated) => {
    let pathname = window.location.pathname.split("/")
    let userid = pathname[pathname.length - 1]
    let agentAuthToken = localStorage.getItem("AGENT_AUTH_TOKEN")
    categoryid === 1
      ? setIspanLoading(true)
      : categoryid === 2
        ? setIsbankLoading(true)
        : setIsdematLoading(true)
    fetch(
      `https://y94x1uz8w8.execute-api.us-east-1.amazonaws.com/api/admin/approveKYCRequest`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-AUTH-TOKEN": agentAuthToken,
        },
        body: JSON.stringify({
          userId: userid,
          categoryId: categoryid,
          KYCStatus: status,
          lastUpdated: lastupdated,
        }),
      }
    )
      .then(res => {
        res.json()
        if (res.ok) {
          categoryid === 1
            ? setIspanLoading(false)
            : categoryid === 2
              ? setIsbankLoading(false)
              : setIsdematLoading(false)
          setState({
            ...state,
            open: true,
            message: status,
            severity: "success",
          })
          CommonApi()
        } else {
          categoryid === 1
            ? setIspanLoading(false)
            : categoryid === 2
              ? setIsbankLoading(false)
              : setIsdematLoading(false)
          setState({
            ...state,
            open: true,
            message: "Something went wrong",
            severity: "error",
          })
        }
      })
      .then(data => {
        console.log("approve status+++", data)
      })
  }
  const ChangeThedirection = (id) => {
    if(id==="rotateimg")
    {
      angle = angle + 90;
      document.getElementById("rotateimg").style.transform = `rotate(${angle}deg)`;
    }
    else
    {
      dematangle = dematangle+90;
      document.getElementById("dematimage").style.transform = `rotate(${dematangle}deg)`;
    }
  }
  const handleClose = () => {
    setState({ ...state, open: false })
  }

  return (
    <div>
      <Snackbar
        anchorOrigin={{ vertical, horizontal }}
        autoHideDuration={4000}
        open={open}
        onClose={handleClose}
        key={vertical + horizontal}
      >
        <Alert onClose={handleClose} severity={state.severity}>
          {state.message}
        </Alert>
      </Snackbar>
      <VerifyButton href={`/ops-dashboard`}>
        <ArrowBackIcon />
        Dashboard
      </VerifyButton>
      {Object.keys(user).length !== 0 &&
        Object.keys(userkycdetails).length !== 0 &&
        Object.keys(userKycStatus).length !== 0 ? (
        <div>
          <Parentrow>
            <AgentName>{user.userName}</AgentName>
            <AgentName>{user.userMobileNumber}</AgentName>
            <AgentName>{user.userEmail}</AgentName>
          </Parentrow>
          <Allcard>
            <WrapImgAndIconToRotate>
              <WrapToRotate onClick={() => ChangeThedirection("rotateimg")}>
                <RotateLeftIcon />
              </WrapToRotate>
              <CardHeader>Pan Verification</CardHeader>
            </WrapImgAndIconToRotate>
            <ImgField>
              {isPanZip ? (
                <ShowPDFButton
                  onClick={() => {
                    setShowPDFFile(panPDFFile)
                    setShowPDFModal(true)
                  }}
                >
                  Show PAN PDF{" "}
                </ShowPDFButton>
              ) : (
                <ImgTag id="rotateimg" src={userkycdetails.panAwsFilename} alt="pan" />
              )}
              <Paninfo>
                <p>Pan Number : {userkycdetails.panNumber}</p>
                <p>Pan Name : {userkycdetails.panName}</p>
              </Paninfo>
              <Paninfo>
                <p>{userKycStatus.panStatus}</p>
                {ispanLoading ? (
                  <LoaderContainer>
                    <Spinner style={{ color: "green" }} animation="border" />
                    <Verifying>Verifying</Verifying>
                  </LoaderContainer>
                ) : (
                  <div>
                    <Approve
                      onClick={() => {
                        changeStatusEvent(
                          "APPROVED",
                          1,
                          userkycdetails.panLastUpdated
                        )
                      }}
                    >
                      Approve
                    </Approve>
                    <Reject
                      onClick={() => {
                        changeStatusEvent(
                          "REJECTED",
                          1,
                          userkycdetails.panLastUpdated
                        )
                      }}
                    >
                      Reject
                    </Reject>
                  </div>
                )}
              </Paninfo>
            </ImgField>
            <div style={{ width: "50%", marginLeft: "auto" }}>
              <CardHeader>Bank Account Verification</CardHeader>
              <ImgField>
                <Paninfo>
                  <Ptag>Account Number : {userkycdetails.accountNumber}</Ptag>
                  <p>Account Name : {userkycdetails.accountName}</p>
                  <p>IFSC : {userkycdetails.ifsc}</p>
                </Paninfo>
                <Paninfo>
                  <p>{userKycStatus.bankStatus}</p>
                  {isbankLoading ? (
                    <LoaderContainer>
                      <Spinner style={{ color: "green" }} animation="border" />
                      <Verifying>Verifying</Verifying>
                    </LoaderContainer>
                  ) : (
                    <div>
                      <Approve
                        onClick={() => {
                          changeStatusEvent(
                            "APPROVED",
                            2,
                            userkycdetails.bankLastUpdated
                          )
                        }}
                      >
                        Approve
                      </Approve>
                      <Reject
                        onClick={() => {
                          changeStatusEvent(
                            "REJECTED",
                            2,
                            userkycdetails.bankLastUpdated
                          )
                        }}
                      >
                        Reject
                      </Reject>
                    </div>
                  )}
                </Paninfo>
              </ImgField>
            </div>
            <WrapImgAndIconToRotate>
              <WrapToRotate onClick={() => ChangeThedirection("dematimage")}>
                <RotateLeftIcon />
              </WrapToRotate>
              <CardHeader>Demat Account Verification</CardHeader>
            </WrapImgAndIconToRotate>
            <ImgField>
              {isDematZip ? (
                <ShowPDFButton
                  onClick={() => {
                    setShowPDFFile(dematPDFFile)
                    setShowPDFModal(true)
                  }}
                >
                  Show DEMAT PDF{" "}
                </ShowPDFButton>
              ) : (
                <ImgTag id="dematimage" src={userkycdetails.dematAwsFilename} alt="demat" />
              )}
              <Paninfo>
                <Ptag>Demat Number : {userkycdetails.dematId}</Ptag>
              </Paninfo>
              <Paninfo>
                <p>{userKycStatus.dematStatus}</p>
                {isdematLoading ? (
                  <LoaderContainer>
                    <Spinner style={{ color: "green" }} animation="border" />
                    <Verifying>Verifying</Verifying>
                  </LoaderContainer>
                ) : (
                  <div>
                    <Approve
                      onClick={() => {
                        changeStatusEvent(
                          "APPROVED",
                          3,
                          userkycdetails.dematLastUpdated
                        )
                      }}
                    >
                      Approve
                    </Approve>
                    <Reject
                      onClick={() => {
                        changeStatusEvent(
                          "REJECTED",
                          3,
                          userkycdetails.dematLastUpdated
                        )
                      }}
                    >
                      Reject
                    </Reject>
                  </div>
                )}
              </Paninfo>
            </ImgField>
          </Allcard>
        </div>
      ) : (
        ""
      )}
      <ShowPDF
        showModal={showPDFModal}
        closeModal={() => setShowPDFModal(false)}
        file={showPDFFile}
      />
    </div>
  )
}

export default DashboardOps
const ImgTag = styled.img`
  width: 50%;
  height: 50%;
`
const WrapImgAndIconToRotate = styled.div`
display: flex;
align-items: center;
justify-content: center;
margin-bottom:10%;
`
const WrapToRotate = styled.div`
width:60px;
border: 2px solid green;
display: flex;
align-items: center;
justify-content: center;
margin-right:2%;
`
const VerifyButton = styled.a`
  width: 130px;
  height: 35px;
  background: #33b6ff;
  border-radius: 10px;
  border: aliceblue;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  text-decoration: none;
  color: #000;
  font-size: 16px;
  margin-left: 2%;
  margin-top: 2%;
`
const Parentrow = styled.div`
  display: flex;
  align-items: center;
`
const AgentName = styled.div`
  margin: 2% 3%;
`
const Ptag = styled.p`
  width: 110%;
`
const CardHeader = styled.div`
  text-align: center;
  margin-bottom: 1%;
  margin-top: 1%;
`
const Approve = styled.div`
  width: 75px;
  background: rgba(83, 187, 83, 0.7);
  border-radius: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 20px;
  cursor: pointer;
  height: 30px;
`
const Reject = styled.div`
  width: 80px;
  background: #ff0000;
  border-radius: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  margin: 1%;
  height: 30px;
`
const ImgField = styled.div`
  display: flex;
  justify-content: center;
  align-items: flex-start;
  margin-left: 16%;
`
const Paninfo = styled.div`
  margin: 3%;
  width: 255px;
`
const Allcard = styled.div`
  display: flex;
  flex-direction: column;
  margin-bottom: 4%;
  // align-items:center;
  // justify-content:center;
`
const LoaderContainer = styled.div`
  align-items: center;
  flex-direction: column;
  justify-content: center;
  align-self: center;
  display: flex;
  margin-top: 40px;
`
const Verifying = styled.div`
  font-size: 14px;
  color: green;
  margin-top: 5%;
`
const ShowPDFButton = styled.div`
  background-color: #53bb53;
  color: black;
  border-radius: 3px;
  cursor: pointer;
  padding: 1rem;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.07), 0 2px 4px rgba(0, 0, 0, 0.07),
    0 4px 8px rgba(0, 0, 0, 0.07), 0 8px 16px rgba(0, 0, 0, 0.07),
    0 16px 32px rgba(0, 0, 0, 0.07), 0 32px 64px rgba(0, 0, 0, 0.07);
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
`
