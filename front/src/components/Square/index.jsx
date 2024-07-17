import { useState } from 'react'

const Square = ({ children, handleChange, index }) => {

    const handleOnClick = () => {
        handleChange(index);
    }

    return (
        <div onClick={handleOnClick} className="square">
            {children}
        </div>
    )
}

export default Square